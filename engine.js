/* ============================================================
 *  幻境online — 游戏引擎层
 *  状态管理 / 属性计算 / 装备生成 / 战斗系统 / 升级 / 存档
 * ============================================================ */

const Engine = (() => {
  const D = GameData;
  const SAVE_KEY = "wapgame_save_v1";

  /* 全局游戏状态 */
  let state = null;

  /* ---------- 工具函数 ---------- */
  const rand  = (a,b)=> a + Math.random()*(b-a);
  const randi = (a,b)=> Math.floor(rand(a,b+1));
  const pick  = arr => arr[Math.floor(Math.random()*arr.length)];
  const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));
  const uid   = (()=>{ let n=0; return ()=> "i"+(Date.now().toString(36))+(n++).toString(36); })();

  function weightedPick(entries){ // entries: [{k,weight}]
    let total = entries.reduce((s,e)=>s+e.weight,0);
    let r = Math.random()*total;
    for(const e of entries){ if((r-=e.weight)<=0) return e.k; }
    return entries[entries.length-1].k;
  }

  /* ---------- 新建角色 ---------- */
  function newGame(name, classId){
    const cls = D.CLASSES[classId];
    state = {
      name: name || "无名英雄",
      classId,
      level: 1,
      xp: 0,
      gold: 80,
      diamond: 0,
      primary: Object.assign({}, cls.startStats), // str/agi/int/vit
      freePoints: 0,
      hp: 0, mp: 0,                 // 当前血蓝(下面fullRestore填充)
      equip: { weapon:null, helm:null, armor:null, boots:null, amulet:null, ring:null },
      bag: [],                      // 装备物品 {..}
      items: {},                    // 消耗品 id->count
      materials: {},                // 材料 id->count
      gems: {},                     // 宝石 "gemKey_grade"->count
      books: {},                    // 技能书 skillId->count
      learned: {},                  // 已学技能 id->true
      skillSlots: [],               // 出战技能(自动战斗使用顺序)
      clearedBoss: {},              // mapId->true
      currentMap: "carol_plain",
      stats_total: { kills:0, deaths:0, bossKills:0, drops:0 },
      autoBattle: false,
      // 任务系统
      quests: {
        mainIdx: 0,          // 当前主线索引
        mainDone: false,     // 当前主线objective是否已达成(待领奖)
        classIdx: 0,         // 当前职业任务索引
        sideActive: {},      // sideId -> {prog:n}
        sideDone: {},        // sideId -> 完成次数(可重复)
        progress: {},        // questId -> 计数进度(kill类,主线+职业线共用)
      },
      killByType: {},        // monsterKey -> 累计击杀
      // 转职
      advance: { t1:null, t2:null },  // 选择的转职选项id
      // 宠物
      pets: [],              // [{uid,species,level,exp}]
      activePet: null,       // uid
      // 签到
      signin: { last:null, total:0 },  // last:'YYYY-MM-DD' total:累计签到天数
      // 称号 / 坐骑
      titles: {}, activeTitle: null,
      mounts: {}, activeMount: null,
      // 声望
      rep: 0,
      // 生活技能熟练度(exp)
      life: { gather:0, alchemy:0, smith:0, lockpick:0 },
    };
    // 起手技能(1级解锁的)
    for(const sk of cls.skills){
      if(D.SKILLS[sk].unlock<=1){ state.learned[sk]=true; }
    }
    rebuildSkillSlots();
    // 起始药水
    state.items.hp_potion_s = 3;
    if(classId==="mage"||classId==="priest"||classId==="paladin") state.items.mp_potion_s = 3;
    fullRestore();
    save();
    return state;
  }

  /* ---------- 属性计算 ---------- */
  // 主属性 = 加点 + 等级自动成长
  function effectivePrimary(){
    const cls = D.CLASSES[state.classId];
    const grow = cls.primary;
    const lvUp = state.level - 1;
    const p = {};
    for(const k of ["str","agi","int","vit"]){
      p[k] = (state.primary[k]||0) + Math.floor((grow[k]||0)*lvUp);
    }
    return p;
  }

  // 计算最终二级属性(含职业基础+主属性转换+装备+等级)
  function computeStats(){
    const cls = D.CLASSES[state.classId];
    const s = {};
    for(const k of D.STAT_KEYS) s[k] = cls.base[k]||0;

    // 等级带来的基础小幅成长
    const lvUp = state.level - 1;
    s.hp  += lvUp*14;
    s.mp  += lvUp*5;
    s.atk += lvUp*1.5;
    s.mat += lvUp*1.5;
    s.def += lvUp*1.0;
    s.mdf += lvUp*1.0;

    // 主属性转换
    const p = effectivePrimary();
    for(const pk in p){
      const conv = D.PRIMARY_TO_STAT[pk];
      for(const sk in conv){ s[sk]+= p[pk]*conv[sk]; }
    }

    // 装备(含强化加成 + 镶嵌宝石)
    for(const slot in state.equip){
      const e = state.equip[slot];
      if(!e) continue;
      for(const stat in e.stats){ s[stat]=(s[stat]||0)+e.stats[stat]; }
      if(e.enhanceBonus){ const es=enhanceStatOf(e); s[es]=(s[es]||0)+e.enhanceBonus; }
      if(e.gems){ for(const g of e.gems){ const gd=D.GEMS[g.key]; if(gd) s[gd.stat]=(s[gd.stat]||0)+gd.vals[g.grade]; } }
    }

    // 转职永久加成
    const advBonus = advanceBonus();
    for(const stat in advBonus){ s[stat]=(s[stat]||0)+advBonus[stat]; }

    // 套装加成(按已穿同套件数触发2/4件)
    const setB = setBonusTotal();
    for(const stat in setB){ s[stat]=(s[stat]||0)+setB[stat]; }

    // 出战宠物被动加成(宠物30%属性转化给主人)
    const pb = petPassive();
    for(const stat in pb){ s[stat]=(s[stat]||0)+pb[stat]; }

    // 称号 + 坐骑 加成
    const tb=titleBonus(); for(const stat in tb){ s[stat]=(s[stat]||0)+tb[stat]; }
    const mb=mountBonus(); for(const stat in mb){ s[stat]=(s[stat]||0)+mb[stat]; }

    // 被动技能:固定加成(add) 后 百分比加成(pct)
    const passives = activePassives();
    for(const pid of passives){ const p=D.PASSIVES[pid]; if(p&&p.add){ for(const stat in p.add) s[stat]=(s[stat]||0)+p.add[stat]; } }
    for(const pid of passives){ const p=D.PASSIVES[pid]; if(p&&p.pct){ for(const stat in p.pct) s[stat]=(s[stat]||0)*(1+p.pct[stat]); } }

    // buff (战斗中临时)
    if(state._buffs){
      for(const b of state._buffs){
        for(const stat in b.add){ s[stat]=(s[stat]||0)+b.add[stat]; }
      }
    }

    // 取整
    for(const k in s) s[k]= Math.round(s[k]*10)/10;
    s.hp = Math.floor(s.hp); s.mp = Math.floor(s.mp);
    return s;
  }

  function fullRestore(){
    const s = computeStats();
    state.hp = s.hp; state.mp = s.mp;
  }

  // 已穿戴套装件数统计 -> 触发的套装加成
  function setBonusInfo(){
    const count = {};
    for(const slot in state.equip){
      const e = state.equip[slot];
      if(e && e.setKey){ count[e.setKey]=(count[e.setKey]||0)+1; }
    }
    return count;
  }
  function setBonusTotal(){
    const count = setBonusInfo();
    const total = {};
    for(const key in count){
      const set = D.EQ_SETS[key];
      if(!set || !set.setBonus) continue;
      for(const th of [2,4,6]){
        if(count[key]>=th && set.setBonus[th]){
          for(const stat in set.setBonus[th]) total[stat]=(total[stat]||0)+set.setBonus[th][stat];
        }
      }
    }
    return total;
  }

  /* ---------- 转职加成 ---------- */
  function advanceBonus(){
    const tree = D.CLASSES[state.classId].advTree;
    const def = D.ADVANCE[tree];
    const out = {};
    if(!def) return out;
    for(const tier of ["t1","t2"]){
      const chosen = state.advance[tier];
      if(!chosen) continue;
      const opt = def[tier].options.find(o=>o.id===chosen);
      if(opt&&opt.bonus){ for(const k in opt.bonus){ out[k]=(out[k]||0)+opt.bonus[k]; } }
    }
    return out;
  }

  /* ---------- 被动技能(随等级自动领悟) ---------- */
  function activePassives(){
    const list = D.CLASS_PASSIVES[state.classId]||[];
    return list.filter(pid=> state.level >= D.PASSIVES[pid].unlock);
  }

  /* ---------- 称号 ---------- */
  function titleMet(cond){
    const t=state.stats_total;
    switch(cond.type){
      case "level": return state.level>=cond.n;
      case "kills": return t.kills>=cond.n;
      case "bossKills": return t.bossKills>=cond.n;
      case "drops": return t.drops>=cond.n;
      case "mainDone": return state.quests.mainIdx>=D.MAIN_QUESTS.length;
      case "advance": return state.advance.t1===cond.id || state.advance.t2===cond.id;
    }
    return false;
  }
  function checkTitles(){
    const newly=[];
    for(const id in D.TITLES){
      if(!state.titles[id] && titleMet(D.TITLES[id].cond)){ state.titles[id]=true; newly.push(id); }
    }
    return newly;
  }
  function setTitle(id){ if(id&&!state.titles[id]) return false; state.activeTitle=id; clampVitals(); save(); return true; }
  function titleBonus(){ const id=state.activeTitle; return (id&&D.TITLES[id])?D.TITLES[id].bonus:{}; }

  /* ---------- 生活技能 ---------- */
  function lifeTierIdx(skill){
    const exp=state.life[skill]||0; let idx=0;
    for(let i=0;i<D.LIFE_TIERS.length;i++){ if(exp>=D.LIFE_TIERS[i].min) idx=i; }
    return idx;
  }
  function lifeTierName(skill){ return D.LIFE_TIERS[lifeTierIdx(skill)].name; }
  function hasMaterials(mats){ for(const id in mats){ if((state.materials[id]||0)<mats[id]) return false; } return true; }
  function consumeMaterials(mats, ratio){ for(const id in mats){ const n=Math.ceil(mats[id]*(ratio||1)); state.materials[id]=(state.materials[id]||0)-n; if(state.materials[id]<=0) delete state.materials[id]; } }
  // 采集:在已解锁地图采材料
  function gatherMap(mapId){
    const pool=D.GATHER_POOL[mapId]; if(!pool) return null;
    const map=D.MAPS.find(m=>m.id===mapId); if(!map||!mapUnlocked(map)) return {err:"地图未解锁"};
    const n = randi(2,4) + Math.floor(lifeTierIdx("gather"));
    const got={};
    for(let i=0;i<n;i++){ const id=pick(pool); got[id]=(got[id]||0)+1; state.materials[id]=(state.materials[id]||0)+1; }
    state.life.gather += 6;
    save();
    return {got};
  }
  // 炼药
  function craftAlchemy(id){
    const r=D.ALCHEMY_RECIPES.find(x=>x.id===id); if(!r) return {err:"配方不存在"};
    if(lifeTierIdx("alchemy")<r.lv) return {err:"炼药等级不足"};
    if(!hasMaterials(r.mats)) return {err:"材料不足"};
    const rate = Math.min(0.98, 0.7 + lifeTierIdx("alchemy")*0.06);
    if(Math.random()<rate){
      consumeMaterials(r.mats,1);
      state.items[r.out]=(state.items[r.out]||0)+r.outN;
      state.life.alchemy += 12; save();
      return {ok:true, out:r.out, n:r.outN};
    } else {
      consumeMaterials(r.mats,0.5);
      state.life.alchemy += 4; save();
      return {ok:false, msg:"炼制失败,损失部分材料"};
    }
  }
  // 锻造
  function craftSmith(id){
    const r=D.SMITH_RECIPES.find(x=>x.id===id); if(!r) return {err:"配方不存在"};
    if(lifeTierIdx("smith")<r.lv) return {err:"锻造等级不足"};
    if(!hasMaterials(r.mats)) return {err:"材料不足"};
    const rate = Math.min(0.95, 0.65 + lifeTierIdx("smith")*0.07);
    if(Math.random()<rate){
      consumeMaterials(r.mats,1);
      const e=genEquip(state.level, 2, {rarity:r.tier, cls:state.classId});
      addEquip(e);
      state.life.smith += 15; save();
      return {ok:true, item:e};
    } else {
      consumeMaterials(r.mats,0.5);
      state.life.smith += 5; save();
      return {ok:false, msg:"锻造失败,损失部分材料"};
    }
  }

  /* ---------- 声望 ---------- */
  function gainRep(n){ state.rep=(state.rep||0)+n; }
  function repTier(){
    let t=D.REP_TIERS[0];
    for(const r of D.REP_TIERS){ if(state.rep>=r.min) t=r; }
    return t;
  }
  function repDiscount(){ return repTier().discount; }
  function repNext(){
    for(const r of D.REP_TIERS){ if(state.rep<r.min) return r; }
    return null;
  }
  function discountPrice(p){ return Math.max(1, Math.round(p*(1-repDiscount()))); }

  /* ---------- 坐骑 ---------- */
  function grantMount(id){ if(!D.MOUNTS[id]) return false; const had=state.mounts[id]; state.mounts[id]=true; if(!state.activeMount) state.activeMount=id; if(!had) save(); return !had; }
  function buyMount(id){
    const m=D.MOUNTS[id]; if(!m||!m.price) return false;
    if(state.mounts[id]) return false;
    if(m.price.gold && state.gold<m.price.gold) return false;
    if(m.price.diamond && state.diamond<m.price.diamond) return false;
    if(m.price.gold) state.gold-=m.price.gold;
    if(m.price.diamond) state.diamond-=m.price.diamond;
    grantMount(id); save(); return true;
  }
  function setMount(id){ if(id&&!state.mounts[id]) return false; state.activeMount=id; clampVitals(); save(); return true; }
  function mountBonus(){ const id=state.activeMount; return (id&&D.MOUNTS[id])?D.MOUNTS[id].bonus:{}; }

  /* ---------- 宠物 ---------- */
  function petStats(pet){
    const sp = D.PETS[pet.species];
    const lv = pet.level;
    const s = {};
    for(const k in sp.base){ s[k] = Math.round(sp.base[k] + (sp.grow[k]||0)*(lv-1)); }
    return s;
  }
  function activePetObj(){
    if(!state.activePet) return null;
    return state.pets.find(p=>p.uid===state.activePet)||null;
  }
  function petPassive(){
    const pet = activePetObj();
    if(!pet) return {};
    const ps = petStats(pet);
    return { atk:Math.round((ps.atk||0)*0.3), hp:Math.round((ps.hp||0)*0.3), def:Math.round((ps.def||0)*0.3), spd:Math.round((ps.spd||0)*0.2) };
  }

  /* ---------- 装备生成 ---------- */
  function classWeaponStat(){
    const c = state ? state.classId : "warrior";
    return (c==="mage"||c==="priest") ? "mat" : "atk";
  }

  // 各职业属性侧重(statBudget分配优先级)
  const CLASS_STAT_PRIORITY = {
    warrior: ["atk","hp","def","crit"],
    paladin: ["atk","def","hp","mat"],
    rogue:   ["atk","crit","spd","dodge"],
    mage:    ["mat","mp","crit","critDmg"],
    priest:  ["mat","mp","hpregen","mdf"],
  };
  // 一个statBudget点换算成的属性值
  function budgetVal(stat, ilvl){
    if(stat==="hp") return Math.round((10+ilvl*1.2)*rand(0.85,1.15));
    if(stat==="mp") return Math.round((6+ilvl*0.6)*rand(0.85,1.15));
    if(D.PERCENT_STATS.has(stat)) return Math.max(1,Math.round((2+ilvl*0.05)*rand(0.8,1.2)));
    return Math.max(1,Math.round((3+ilvl*0.45)*rand(0.85,1.15)));
  }

  // 掉落装备:品质模板(无随机词缀) + 护甲/武器类型 + 职业归属
  function genEquip(level, dropBonus, opts){
    opts = opts||{};
    // 选品质(dropBonus提升高品质权重)
    const entries = D.RARITY_ORDER.map((k,i)=>{
      let w = D.RARITY[k].weight;
      const luck = 1 + dropBonus*0.5;
      w *= Math.pow(luck, i*0.6); // 越高品质越受dropBonus放大
      return {k, weight:w};
    });
    const rarity = opts.rarity || weightedPick(entries);
    const rdata = D.RARITY[rarity];
    const slot = opts.slot || pick(Object.keys(D.SLOTS));
    const ilvl = Math.max(1, Math.round(level));
    const lvScale = 1 + ilvl*0.12;

    // 职业归属:55%玩家职业,否则随机(制造"非本职掉落"的取舍)
    const allClasses = Object.keys(D.CLASSES);
    let targetClass = opts.cls || (state && Math.random()<0.55 ? state.classId : pick(allClasses));
    if(!D.CLASSES[targetClass]) targetClass = "warrior";

    // 护甲/武器类型
    let armorType=null, weaponType=null;
    if(slot==="weapon"){ weaponType = pick(D.CLASS_GEAR[targetClass].weapons); }
    else if(D.ARMOR_SLOTS.includes(slot)){ armorType = D.CLASS_GEAR[targetClass].armor; }
    // amulet/ring 通用,无类型

    // 主属性(来自部位模板)
    const tpl = D.SLOT_BASE[slot];
    const stats = {};
    for(const stat in tpl){
      // 武器主属性按武器类型(atk/mat),跳过另一种
      if(slot==="weapon"){
        const wstat = D.WEAPON_TYPES[weaponType].stat;
        if((stat==="atk"||stat==="mat") && stat!==wstat) continue;
      }
      stats[stat] = Math.max(1, Math.round(tpl[stat]*lvScale*rdata.mult*rand(0.9,1.1)));
    }
    if(slot==="weapon"){
      const wstat = D.WEAPON_TYPES[weaponType].stat;
      stats[wstat] = (stats[wstat]||0) + Math.max(1, Math.round(9*lvScale*rdata.mult*rand(0.95,1.1)));
    }

    // statBudget:分配到职业相关属性(固定,无随机词缀)
    const priority = CLASS_STAT_PRIORITY[targetClass];
    for(let i=0;i<rdata.statBudget;i++){
      const stat = priority[i % priority.length];
      stats[stat] = (stats[stat]||0) + budgetVal(stat, ilvl);
    }

    // 名称(品质 + 与类型一致的名称,避免"锁甲(皮甲)"矛盾)
    const ARMOR_NAME = { helm:"头盔", armor:"胸甲", boots:"战靴" };
    let base;
    if(weaponType) base = D.WEAPON_TYPES[weaponType].name;
    else if(armorType) base = D.ARMOR_TYPES[armorType].name + ARMOR_NAME[slot];
    else base = pick(D.EQ_NAME[slot]); // 项链/戒指通用
    const name = (rarity==="white"?"":rdata.name) + base;

    return {
      id: uid(), slot, rarity, name, level: ilvl,
      armorType, weaponType, cls: (armorType||weaponType)?targetClass:null,
      sockets: rdata.sockets, gems: [],
      stats,
      power: equipPower(stats),
    };
  }

  // 能否穿戴(职业/护甲/武器限制 + 等级)
  function canEquip(e){
    if(!e) return false;
    if(e.armorType) return D.ARMOR_TYPES[e.armorType].classes.includes(state.classId);
    if(e.weaponType) return D.WEAPON_TYPES[e.weaponType].classes.includes(state.classId);
    return true; // 项链/戒指通用
  }

  /* ---------- 强化 / 镶嵌 / 潘多拉之盒 ---------- */
  // 强化加成作用的属性:武器→其攻击属性, 其余→物防
  function enhanceStatOf(e){
    if(e.weaponType) return D.WEAPON_TYPES[e.weaponType].stat;
    return "def";
  }
  // 找背包或已穿的装备
  function findEquipById(id){
    for(const slot in state.equip){ if(state.equip[slot]&&state.equip[slot].id===id) return state.equip[slot]; }
    return state.bag.find(b=>b.id===id)||null;
  }
  // 装备含强化与宝石后的有效战力
  function effPower(e){
    const merged = Object.assign({}, e.stats);
    if(e.enhanceBonus){ const es=enhanceStatOf(e); merged[es]=(merged[es]||0)+e.enhanceBonus; }
    if(e.gems){ for(const g of e.gems){ const gd=D.GEMS[g.key]; if(gd) merged[gd.stat]=(merged[gd.stat]||0)+gd.vals[g.grade]; } }
    return equipPower(merged);
  }
  // 强化:消耗1幸运宝石
  function enhanceEquip(id){
    const e = findEquipById(id);
    if(!e) return {ok:false,msg:"装备不存在"};
    const cur = e.plus||0;
    if(cur>=D.ENHANCE_MAX) return {ok:false,msg:"已满级+15"};
    if(!(state.materials.lucky_gem>0)) return {ok:false,msg:"缺少幸运宝石"};
    state.materials.lucky_gem--; if(state.materials.lucky_gem<=0) delete state.materials.lucky_gem;
    const row = D.ENHANCE[cur];
    if(Math.random() < row.rate){
      e.plus = cur+1; e.enhanceBonus = (e.enhanceBonus||0)+row.bonus;
      e.power = effPower(e); clampVitals(); save();
      return {ok:true, msg:`强化成功 +${e.plus}`, plus:e.plus};
    }
    // 失败
    if(row.fail==="down" && cur>0){
      const prevBonus = D.ENHANCE[cur-1].bonus;
      e.plus=cur-1; e.enhanceBonus=Math.max(0,(e.enhanceBonus||0)-prevBonus);
      e.power=effPower(e); save();
      return {ok:false, msg:`强化失败,跌至 +${e.plus}`, plus:e.plus};
    }
    if(row.fail==="break"){
      if(Math.random() < D.ENHANCE_BREAK_CHANCE){
        // 碎裂:从背包/装备移除
        destroyEquip(id); save();
        return {ok:false, msg:"强化失败,装备碎裂!", broken:true};
      }
      const prevBonus = cur>0?D.ENHANCE[cur-1].bonus:0;
      e.plus=Math.max(0,cur-1); e.enhanceBonus=Math.max(0,(e.enhanceBonus||0)-prevBonus);
      e.power=effPower(e); save();
      return {ok:false, msg:`强化失败,跌至 +${e.plus}`, plus:e.plus};
    }
    return {ok:false, msg:"强化失败(无变化)"};
  }
  function destroyEquip(id){
    for(const slot in state.equip){ if(state.equip[slot]&&state.equip[slot].id===id){ state.equip[slot]=null; return; } }
    const i=state.bag.findIndex(b=>b.id===id); if(i>=0) state.bag.splice(i,1);
  }
  // 镶嵌宝石:gemKey+grade 来自 state.gems
  function socketGem(id, gemKey, grade){
    const e=findEquipById(id);
    if(!e) return {ok:false,msg:"装备不存在"};
    if(!e.sockets || (e.gems||[]).length>=e.sockets) return {ok:false,msg:"无空凹槽"};
    const gk = gemKey+"_"+grade;
    if(!(state.gems[gk]>0)) return {ok:false,msg:"没有该宝石"};
    state.gems[gk]--; if(state.gems[gk]<=0) delete state.gems[gk];
    if(!e.gems) e.gems=[];
    e.gems.push({key:gemKey, grade:grade});
    e.power=effPower(e); clampVitals(); save();
    return {ok:true, msg:`镶嵌 ${D.GEMS[gemKey].name}`};
  }
  // 潘多拉之盒:3件同品质 -> 10%升一阶,否则全失
  function pandoraCombine(ids){
    if(ids.length!==3) return {ok:false,msg:"需3件装备"};
    const items = ids.map(id=>state.bag.find(b=>b.id===id)).filter(Boolean);
    if(items.length!==3) return {ok:false,msg:"装备需在背包"};
    const r = items[0].rarity;
    if(!items.every(it=>it.rarity===r)) return {ok:false,msg:"需同品质"};
    const idx = D.RARITY_ORDER.indexOf(r);
    if(idx>=D.RARITY_ORDER.length-1) return {ok:false,msg:"传奇无法再合成"};
    // 移除3件
    for(const id of ids){ const i=state.bag.findIndex(b=>b.id===id); if(i>=0) state.bag.splice(i,1); }
    if(Math.random()<0.10){
      const up = D.RARITY_ORDER[idx+1];
      const e = genEquip(items[0].level, 2, {rarity:up, slot:items[0].slot, cls:state.classId});
      addEquip(e); save();
      return {ok:true, success:true, msg:`合成成功!获得${D.RARITY[up].name}装备`, item:e};
    }
    save();
    return {ok:true, success:false, msg:"合成失败,材料消失了…"};
  }
  // 掉落随机宝石
  function rollGem(){
    const keys=Object.keys(D.GEMS);
    const key=pick(keys);
    // 等级越高品级越高(0-4),低权重高品
    const r=Math.random();
    const grade = r<0.45?0 : r<0.75?1 : r<0.92?2 : r<0.99?3 : 4;
    const gk=key+"_"+grade;
    state.gems[gk]=(state.gems[gk]||0)+1;
    return {key, grade};
  }

  // 装备战力评估(用于对比/排序)
  function equipPower(stats){
    const w = { hp:0.2, mp:0.1, atk:2, mat:2, def:1.5, mdf:1.5, spd:1.5, crit:3, critDmg:0.8, dodge:2.5, acc:1, lifesteal:3, hpregen:1 };
    let p=0; for(const k in stats) p+= (stats[k]||0)*(w[k]||1);
    return Math.round(p);
  }

  // 生成具名套装碎片(玩家本职可穿,带套装标记)
  function genSetPiece(setKey, level){
    const set = D.EQ_SETS[setKey];
    if(!set) return null;
    const e = genEquip(level, 3, { rarity:set.rarity, cls: state?state.classId:"warrior" });
    e.setName = set.name;
    e.setKey = setKey;
    for(const k in e.stats){ e.stats[k] = Math.round(e.stats[k]*set.bonus); }
    e.name = set.name + "·" + D.SLOTS[e.slot].name;
    e.power = equipPower(e.stats);
    return e;
  }

  /* ---------- 背包/装备操作 ---------- */
  function addEquip(e){
    state.bag.push(e);
    if(state.bag.length>200) state.bag.shift(); // 上限保护
  }
  function equipItem(itemId){
    const idx = state.bag.findIndex(b=>b.id===itemId);
    if(idx<0) return false;
    const item = state.bag[idx];
    if(!canEquip(item)) return "restricted"; // 职业/护甲限制
    const prev = state.equip[item.slot];
    state.equip[item.slot] = item;
    state.bag.splice(idx,1);
    if(prev) state.bag.push(prev);
    clampVitals();
    save();
    return true;
  }
  function unequip(slot){
    const e = state.equip[slot];
    if(!e) return false;
    state.bag.push(e);
    state.equip[slot]=null;
    clampVitals();
    save();
    return true;
  }
  function sellEquip(itemId){
    const idx = state.bag.findIndex(b=>b.id===itemId);
    if(idx<0) return 0;
    const e = state.bag[idx];
    const price = Math.max(2, Math.round(e.power*0.4 * D.RARITY[e.rarity].mult));
    state.gold += price;
    state.bag.splice(idx,1);
    save();
    return price;
  }
  function clampVitals(){
    const s = computeStats();
    state.hp = clamp(state.hp,0,s.hp);
    state.mp = clamp(state.mp,0,s.mp);
  }

  /* ---------- 消耗品 ---------- */
  function buyItem(id){
    const it = D.CONSUMABLES[id];
    if(!it) return false;
    const price = discountPrice(it.price);
    if(state.gold < price) return false;
    state.gold -= price;
    state.items[id] = (state.items[id]||0)+1;
    save();
    return true;
  }
  function useConsumable(id){ // 非战斗使用
    if(!(state.items[id]>0)) return false;
    const it = D.CONSUMABLES[id];
    const s = computeStats();
    if(it.heal){ state.hp = clamp(state.hp+it.heal,0,s.hp); }
    if(it.mana){ state.mp = clamp(state.mp+it.mana,0,s.mp); }
    state.items[id]--;
    if(state.items[id]<=0) delete state.items[id];
    save();
    return true;
  }

  /* ---------- 升级 ---------- */
  function gainXp(amount){
    state.xp += amount;
    let leveled = [];
    while(state.level < D.MAX_LEVEL && state.xp >= D.xpToNext(state.level)){
      state.xp -= D.xpToNext(state.level);
      state.level++;
      state.freePoints += D.POINTS_PER_LEVEL;
      // 主动技能不再随等级自动解锁,改为技能书学习(见 learnSkillBook)
      leveled.push(state.level);
    }
    if(state.level>=D.MAX_LEVEL) state.xp=0;
    if(leveled.length){ rebuildSkillSlots(); fullRestore(); }
    return leveled;
  }

  function allocate(primaryKey, n=1){
    if(state.freePoints < n) return false;
    state.primary[primaryKey] = (state.primary[primaryKey]||0)+n;
    state.freePoints -= n;
    clampVitals();
    save();
    return true;
  }

  function resetPoints(){
    // 洗点：消耗钻石或金币
    const cost = 50 + state.level*5;
    if(state.gold < cost) return false;
    state.gold -= cost;
    const cls = D.CLASSES[state.classId];
    // 退回到初始加点，返还所有后续加的点
    const start = cls.startStats;
    let returned=0;
    for(const k of ["str","agi","int","vit"]){
      returned += (state.primary[k]-start[k]);
      state.primary[k]=start[k];
    }
    state.freePoints += returned;
    clampVitals();
    save();
    return true;
  }

  /* 该职业全部可能技能(基础 + 已选转职专属) */
  function classSkillList(){
    const cls = D.CLASSES[state.classId];
    const list = cls.skills.slice();
    const def = D.ADVANCE[cls.advTree];
    if(def){
      for(const tier of ["t1","t2"]){
        const chosen = state.advance[tier];
        if(!chosen) continue;
        const opt = def[tier].options.find(o=>o.id===chosen);
        if(opt) for(const sk of opt.skills) if(!list.includes(sk)) list.push(sk);
      }
    }
    return list;
  }

  /* 自动整理出战技能(攻击技能优先用) */
  function rebuildSkillSlots(){
    state.skillSlots = classSkillList().filter(sk=>state.learned[sk]);
  }

  /* ---------- 技能书 ---------- */
  // 可通过技能书学习的技能(本职非初始、非转职专属)
  function bookSkills(){
    const cls = D.CLASSES[state.classId];
    return cls.skills.filter(sk=> D.SKILLS[sk].unlock>1 && D.SKILLS[sk].unlock<999);
  }
  function skillBookPrice(skillId){
    const d = D.SKILLS[skillId];
    return 80 + d.unlock*35;
  }
  function buySkillBook(skillId){
    if(!bookSkills().includes(skillId)) return false;
    const price = discountPrice(skillBookPrice(skillId));
    if(state.gold < price) return false;
    state.gold -= price;
    state.books[skillId] = (state.books[skillId]||0)+1;
    save();
    return true;
  }
  // 学习技能书:需拥有书 + 等级达标 + 未学
  function learnSkillBook(skillId){
    if(state.learned[skillId]) return "learned";
    if(!(state.books[skillId]>0)) return "nobook";
    if(state.level < D.SKILLS[skillId].unlock) return "level";
    state.books[skillId]--;
    if(state.books[skillId]<=0) delete state.books[skillId];
    state.learned[skillId]=true;
    rebuildSkillSlots();
    save();
    return true;
  }
  // 掉落随机本职技能书(玩家尚未学会的)
  function rollSkillBook(monLevel){
    const candidates = bookSkills().filter(sk=> !state.learned[sk] && D.SKILLS[sk].unlock<=monLevel+3);
    if(!candidates.length) return null;
    const sk = pick(candidates);
    state.books[sk]=(state.books[sk]||0)+1;
    return sk;
  }

  /* ============================================================
   *  转职
   * ============================================================ */
  function advanceInfo(){
    const tree = D.CLASSES[state.classId].advTree;
    return D.ADVANCE[tree];
  }
  // 当前可转职的阶段(返回 't1'/'t2'/null)
  function pendingAdvance(){
    const def = advanceInfo(); if(!def) return null;
    if(!state.advance.t1 && state.level>=def.t1.level) return "t1";
    if(state.advance.t1 && def.t2 && !state.advance.t2 && state.level>=def.t2.level) return "t2";
    return null;
  }
  function doAdvance(tier, optionId){
    const def = advanceInfo(); if(!def||!def[tier]) return false;
    if(state.advance[tier]) return false;
    if(state.level < def[tier].level) return false;
    if(tier==="t2" && !state.advance.t1) return false;
    const opt = def[tier].options.find(o=>o.id===optionId);
    if(!opt) return false;
    state.advance[tier]=optionId;
    for(const sk of opt.skills){ state.learned[sk]=true; }
    rebuildSkillSlots();
    fullRestore();
    save();
    return opt;
  }
  // 当前职业称号
  function classTitle(){
    const cls = D.CLASSES[state.classId];
    const def = advanceInfo();
    if(!def) return cls.name;
    let title = cls.name;
    if(state.advance.t2){ const o=def.t2.options.find(o=>o.id===state.advance.t2); if(o) return o.name; }
    if(state.advance.t1){ const o=def.t1.options.find(o=>o.id===state.advance.t1); if(o) return o.name; }
    return title;
  }

  /* ============================================================
   *  宠物
   * ============================================================ */
  function petXpToNext(lv){ return Math.floor(80*Math.pow(lv,1.4)); }
  function hatchEgg(){ // 按权重随机孵化一只宠物
    const k = weightedPick(D.PET_EGG_POOL.map(e=>({k:e.k,weight:e.w})));
    const pet = { uid:uid(), species:k, level:1, exp:0 };
    state.pets.push(pet);
    if(!state.activePet) state.activePet = pet.uid;
    save();
    return pet;
  }
  function setActivePet(petUid){
    if(petUid && !state.pets.find(p=>p.uid===petUid)) return false;
    state.activePet = petUid;
    clampVitals();
    save();
    return true;
  }
  function buyPetEgg(){
    if(state.diamond < D.PET_EGG_PRICE) return null;
    state.diamond -= D.PET_EGG_PRICE;
    return hatchEgg();
  }
  function petGainXp(amount){
    const pet = activePetObj();
    if(!pet) return [];
    let leveled=[];
    pet.exp += amount;
    // 宠物等级不超过主人
    while(pet.level < state.level && pet.exp >= petXpToNext(pet.level)){
      pet.exp -= petXpToNext(pet.level);
      pet.level++;
      leveled.push(pet.level);
    }
    if(pet.level>=state.level) pet.exp=Math.min(pet.exp, petXpToNext(pet.level));
    return leveled;
  }
  function releasePet(petUid){ // 放生换信用点
    const idx = state.pets.findIndex(p=>p.uid===petUid);
    if(idx<0) return false;
    const pet = state.pets[idx];
    state.diamond += Math.round(10 + pet.level*2);
    if(state.activePet===petUid) state.activePet = state.pets.find(p=>p.uid!==petUid)?.uid||null;
    state.pets.splice(idx,1);
    clampVitals();
    save();
    return true;
  }

  /* ============================================================
   *  每日签到
   * ============================================================ */
  function todayStr(){
    const d=new Date();
    return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
  }
  function canSignIn(){ return state.signin.last !== todayStr(); }
  function signinDayIndex(){ return state.signin.total % D.SIGNIN.length; }
  function doSignIn(){
    if(!canSignIn()) return null;
    const idx = signinDayIndex();
    const entry = D.SIGNIN[idx];
    const r = entry.reward;
    giveReward(r);
    let egg=null;
    if(r.petEgg){ egg = hatchEgg(); }
    state.signin.last = todayStr();
    state.signin.total++;
    save();
    return { entry, egg };
  }

  /* ============================================================
   *  随机奇遇(roguelike)
   * ============================================================ */
  let encounter = null;
  // 进入地图刷怪时,有概率触发奇遇而非普通战斗
  function rollEncounter(mapId){
    if(Math.random() > 0.22) return null;
    const map = D.MAPS.find(m=>m.id===mapId);
    if(!map) return null;
    const types = ["treasure","locked_chest","shrine","merchant","ambush"];
    const type = pick(types);
    encounter = { type, mapId, map };
    const isRogue = state.classId==="rogue";
    const T = {
      treasure:    { icon:"🎁", title:"无主的宝箱", text:"草丛里有个未上锁的宝箱,似乎被冒险者遗落。",
                     actions:[{id:"open",label:"打开宝箱"},{id:"leave",label:"离开"}] },
      locked_chest:{ icon:"🔒", title:"上锁的宝箱", text:"一个沉重的上锁宝箱,锁孔泛着微光。"+(isRogue?"以你的开锁技巧,不在话下。":"你没有开锁技能,只能尝试硬撬。"),
                     actions:[{id:"pick",label:isRogue?"开锁(盗贼)":"硬撬(有风险)"},{id:"leave",label:"离开"}] },
      shrine:      { icon:"⛩️", title:"古老的祭坛", text:"一座供奉光明神的残破祭坛,似乎仍有神力残留。",
                     actions:[{id:"pray",label:"虔诚祈祷"},{id:"leave",label:"离开"}] },
      merchant:    { icon:"🧳", title:"流浪行商", text:"「嘿,冒险者!补给品打折,要来点吗?」一个神秘商人拦住了你。",
                     actions:[{id:"buy",label:"购买补给(花100金)"},{id:"leave",label:"离开"}] },
      ambush:      { icon:"💀", title:"精英伏击", text:"一只强大的精英怪从暗处扑出,挡住了去路!",
                     actions:[{id:"fight",label:"应战(精英战)"},{id:"flee",label:"尝试逃跑"}] },
    };
    return Object.assign({}, T[type], {type});
  }
  // 处理奇遇选择,返回 {msg, drops?, battle?:{elite}, gold?}
  function applyEncounter(actionId){
    if(!encounter) return {msg:"无效"};
    const { type, map } = encounter;
    const isRogue = state.classId==="rogue";
    const res = { msg:"" };
    if(actionId==="leave"){ encounter=null; res.msg="你悄悄离开了。"; return res; }

    if(type==="treasure"){
      const gold = Math.round((20+map.lv*8)*rand(0.8,1.6));
      state.gold += gold; res.gold=gold; res.msg=`打开宝箱,获得 ${gold} 金币`;
      if(Math.random()<0.5){ const e=genEquip(map.lv,map.dropBonus); addEquip(e); res.drops=[e]; res.msg+=`,还有一件装备!`; }
    }
    else if(type==="locked_chest"){
      const lockTier = isRogue ? lifeTierIdx("lockpick") : 0;
      const success = isRogue ? (Math.random()<0.92) : (Math.random()<0.5);
      if(success){
        if(isRogue) state.life.lockpick += 10;
        const gold = Math.round((40+map.lv*12)*rand(0.9,1.7)*(1+lockTier*0.15));
        state.gold += gold; res.gold=gold;
        const e=genEquip(map.lv+2, map.dropBonus+1+lockTier); addEquip(e); res.drops=[e];
        res.msg=`${isRogue?"开锁成功(开锁"+lifeTierName("lockpick")+")":"撬开了"}！获得 ${gold} 金币和一件好装备!`;
      } else {
        const dmg=Math.round(computeStats().hp*0.15);
        state.hp=clamp(state.hp-dmg,1,computeStats().hp);
        res.msg=`撬锁失败,触发陷阱,损失 ${dmg} 生命。`;
      }
    }
    else if(type==="shrine"){
      const r=Math.random();
      if(r<0.45){ const g=Math.round((30+map.lv*10)*rand(0.8,1.5)); state.gold+=g; res.gold=g; res.msg=`神光闪烁,获得 ${g} 金币的供奉。`; }
      else if(r<0.8){ const s=computeStats(); state.hp=s.hp; state.mp=s.mp; res.msg="神圣之力涌入,生命与法力完全恢复!"; }
      else { const e=genEquip(map.lv+1,map.dropBonus+2); addEquip(e); res.drops=[e]; res.msg="祭坛显灵,赐予你一件装备!"; }
    }
    else if(type==="merchant"){
      if(actionId==="buy"){
        if(state.gold<100){ res.msg="金币不足,商人耸耸肩走了。"; }
        else {
          state.gold-=100;
          state.items.hp_potion_m=(state.items.hp_potion_m||0)+2;
          state.items.mp_potion_m=(state.items.mp_potion_m||0)+1;
          res.msg="买到补给:中级治疗药剂×2、中级法力药剂×1!";
        }
      }
    }
    else if(type==="ambush"){
      if(actionId==="flee"){
        const ok=Math.random()<0.5;
        encounter=null;
        res.msg= ok?"你成功避开了伏击。":"逃跑失败,精英怪扑了上来!";
        if(!ok) res.battle={elite:true};
        return res;
      } else {
        encounter=null;
        res.battle={elite:true};
        res.msg="迎战精英怪!";
        return res;
      }
    }
    encounter=null;
    save();
    return res;
  }
  // 开启一场精英伏击战
  function startEliteBattle(mapId){
    const map = D.MAPS.find(m=>m.id===mapId);
    if(!map) return null;
    const lv = map.lv;
    const enemies = [ makeMonster(pick(map.monsters), lv+1, map, false, true) ];
    setupBattle(map, false, enemies, "💀 精英伏击！");
    return battle;
  }

  /* ============================================================
   *  战斗系统
   * ============================================================ */
  let battle = null;

  function setupBattle(map, isBoss, enemies, logMsg){
    battle = {
      map, isBoss, enemies,
      log: [], turn: 0, over: false, result: null,
      cooldowns: {}, rewards: { xp:0, gold:0, drops:[] },
    };
    state._buffs = [];
    pushLog(logMsg || `⚔️ 进入战斗：${enemies.map(e=>e.name).join("、")}`);
    save();
    return battle;
  }

  function startBattle(mapId, isBoss){
    const map = D.MAPS.find(m=>m.id===mapId);
    if(!map) return null;
    const lv = map.lv;
    let enemies = [];
    if(isBoss){
      enemies = [ makeMonster(map.boss, lv, map, true) ];
    } else {
      // 1~3只普通怪,每只有概率为精英怪
      const n = randi(1,3);
      for(let i=0;i<n;i++){
        const elite = Math.random() < 0.12;
        enemies.push( makeMonster(pick(map.monsters), lv, map, false, elite) );
      }
    }
    return setupBattle(map, isBoss, enemies);
  }

  function makeMonster(key, mapLv, map, isBoss, isElite){
    const t = D.MONSTERS[key];
    const lvVar = isBoss ? mapLv+2 : mapLv + randi(-1,2);
    const lv = Math.max(1, lvVar);
    const scale = 1 + lv*0.13; // 仅用于经验/金币
    const eHp = isElite?2.5:1, eAtk = isElite?1.35:1, eRew = isElite?2.4:1;
    // 血量随等级强成长(hpM/9 为相对权重),保证战斗持续3-4回合
    const hp = Math.round((28*lv + 5*Math.pow(lv,1.5)) * (t.hpM/9) * eHp);
    // 攻击:线性+二次项,前期线性、后期二次拉升威胁
    const atk = Math.round(t.atkM * (3 + 0.9*lv + 0.03*lv*lv) * eAtk);
    const def = Math.round(t.defM * (2 + 0.6*lv) * (isElite?1.2:1));
    return {
      key, name:(isElite?"精英·":"")+t.name, icon:t.icon, type:t.type, boss:!!t.boss, elite:!!isElite,
      level: lv,
      maxhp: hp, hp,
      atk, def,
      spd: t.spd + Math.floor(lv*0.2),
      crit: isBoss?10:(isElite?8:5), dodge: isBoss?5:3, acc:95,
      xp: Math.round(t.xp*scale*eRew), gold: Math.round(t.gold*scale*eRew),
      _dot: null, _slow:0, _stun:0,
      _map: map,
    };
  }

  function pushLog(msg){ battle.log.push(msg); if(battle.log.length>60) battle.log.shift(); }

  // 伤害计算:减伤率 = def/(def + K*防御方等级),防止防御后期无限免伤(借鉴暗黑)
  function calcDamage(rawAtk, defStat, defLevel, opts={}){
    const K = 45;
    const eff = defStat * (1 - (opts.pen||0));
    const lv = Math.max(1, defLevel||1);
    const mitigation = eff / (eff + K*lv);
    let dmg = rawAtk * (1 - mitigation);
    dmg *= rand(0.92, 1.08);
    return Math.max(1, Math.round(dmg));
  }

  function aliveEnemies(){ return battle.enemies.filter(e=>e.hp>0); }

  // 玩家使用技能(skillId) 对 targetIndex
  function playerAction(skillId, targetIndex){
    if(battle.over) return;
    const sk = skillId==="attack" ? null : D.SKILLS[skillId];
    const s = computeStats();

    if(sk){
      if((battle.cooldowns[skillId]||0)>0){ return {err:"技能冷却中"}; }
      if(state.mp < sk.mp){ return {err:"法力不足"}; }
      state.mp -= sk.mp;
      if(sk.cd>0) battle.cooldowns[skillId]= sk.cd+1; // +1 因当回合末统一-1
    }

    // buff类技能
    if(sk && sk.type==="buff"){
      applyBuff(sk);
      pushLog(`✨ 你使用了 ${sk.name}`);
      endPlayerTurn();
      return {ok:true};
    }
    // 治疗
    if(sk && sk.type==="heal"){
      let heal = Math.round(s.mat * sk.power);
      if(sk.healStr) heal += Math.round(s.atk*0.5);
      state.hp = clamp(state.hp+heal, 0, s.hp);
      pushLog(`💚 你使用 ${sk.name}，恢复 ${heal} 生命`);
      petAssist();
      endPlayerTurn();
      return {ok:true};
    }

    // 伤害技能 / 普攻
    const targets = pickTargets(sk, targetIndex);
    const isPhys = !sk || sk.type==="physical";
    const baseAtk = isPhys ? s.atk : s.mat;
    const power = sk ? sk.power : 1.0;
    const hits = sk && sk.hits ? sk.hits : 1;

    for(const tgt of targets){
      if(tgt.hp<=0) continue;
      for(let h=0; h<hits; h++){
        if(tgt.hp<=0) break;
        // 命中判定
        let acc = s.acc + (sk&&sk.buff?0:0);
        if(sk&&sk.critUp) {}
        if(Math.random()*100 > clamp(acc - tgt.dodge,40,100)){
          pushLog(`💨 ${tgt.name} 闪避了你的攻击`);
          continue;
        }
        // 暴击
        let critChance = s.crit + (sk&&sk.critUp? sk.critUp*100:0);
        let isCrit = Math.random()*100 < critChance;
        if(sk&&sk.exec && tgt.hp/tgt.maxhp < sk.exec) isCrit = true;
        let raw = baseAtk*power;
        // 斩杀加成
        if(sk&&sk.exec && tgt.hp/tgt.maxhp < sk.exec) raw *= 2;
        if(isCrit) raw *= (s.critDmg/100);
        const defStat = isPhys ? tgt.def : Math.round(tgt.def*0.7);
        let dmg = calcDamage(raw, defStat, tgt.level, {pen: sk&&sk.pen?sk.pen:0});
        tgt.hp -= dmg;
        pushLog(`${isCrit?"💥暴击！":"🗡️"} 对 ${tgt.name} 造成 ${dmg} 伤害${sk?`（${sk.name}）`:""}`);

        // 吸血
        let ls = (s.lifesteal/100) + (sk&&sk.lifesteal?sk.lifesteal:0);
        if(ls>0){
          const heal = Math.round(dmg*ls);
          if(heal>0){ state.hp=clamp(state.hp+heal,0,s.hp); pushLog(`🩸 吸血回复 ${heal}`); }
        }
        // 中毒DOT
        if(sk&&sk.dot){
          tgt._dot = { dmg: Math.round(baseAtk*sk.dot.pct), turns: sk.dot.turns };
          pushLog(`☠️ ${tgt.name} 中毒了`);
        }
        // 减速
        if(sk&&sk.slow){ tgt._slow = 2; }
        // 击晕
        if(sk&&sk.stun){ tgt._stun = sk.stun; pushLog(`💫 ${tgt.name} 被击晕 ${sk.stun} 回合`); }
        // 偷窃(盗贼)
        if(sk&&sk.steal){
          const stolen = Math.max(1, Math.round(tgt.gold * sk.steal));
          tgt.gold = Math.max(0, tgt.gold - stolen);
          state.gold += stolen;
          pushLog(`💰 偷取了 ${stolen} 金币！`);
        }
      }
      checkEnemyDeath(tgt);
    }
    // 牧师群体技能自疗
    if(sk&&sk.healSelf){
      const heal = Math.round(s.mat*sk.healSelf);
      state.hp=clamp(state.hp+heal,0,s.hp);
      pushLog(`💚 回复自身 ${heal}`);
    }

    petAssist();
    endPlayerTurn();
    return {ok:true};
  }

  /* 出战宠物协助攻击(玩家行动后触发一次) */
  function petAssist(){
    if(battle.over) return;
    const pet = activePetObj();
    if(!pet) return;
    if(aliveEnemies().length===0) return;
    const sp = D.PETS[pet.species];
    const ps = petStats(pet);
    // 攻击血量最低的活敌
    let tgt=null, min=Infinity;
    for(const e of battle.enemies){ if(e.hp>0 && e.hp<min){min=e.hp;tgt=e;} }
    if(!tgt) return;
    const raw = (ps.atk||0) * sp.power * rand(0.9,1.1);
    const defStat = sp.magical ? Math.round(tgt.def*0.7) : tgt.def;
    const dmg = calcDamage(raw, defStat, tgt.level);
    tgt.hp -= dmg;
    pushLog(`🐾 ${sp.name} 使用「${sp.skill}」造成 ${dmg} 伤害`);
    // 宠物治疗(灵光枭/凤雏)
    if(sp.heal){
      const s = computeStats();
      const h = Math.round((ps.atk||0)*sp.heal);
      if(h>0){ state.hp=clamp(state.hp+h,0,s.hp); pushLog(`💚 ${sp.name} 治疗你 ${h}`); }
    }
    checkEnemyDeath(tgt);
  }

  function pickTargets(sk, targetIndex){
    if(sk && sk.aoe) return aliveEnemies();
    const alive = aliveEnemies();
    if(targetIndex!=null && battle.enemies[targetIndex] && battle.enemies[targetIndex].hp>0)
      return [battle.enemies[targetIndex]];
    return alive.length? [alive[0]] : [];
  }

  function applyBuff(sk){
    const s = computeStats();
    const add = {};
    const b = sk.buff;
    for(const k in b){
      if(k==="turns") continue;
      // 百分比buff基于当前基础值
      if(["atk","def","mat","mdf","spd"].includes(k)){
        add[k] = Math.round(s[k]*b[k]);
      } else if(["crit","dodge","acc"].includes(k)){
        add[k] = Math.round(b[k]*100);
      } else if(k==="hpregen"){
        add[k] = Math.round(s.hp*b[k]); // 当作每回合定量
      }
    }
    state._buffs.push({ name:sk.name, add, turns:b.turns });
  }

  function checkEnemyDeath(tgt){
    if(tgt.hp<=0){
      tgt.hp=0;
      pushLog(`☠️ ${tgt.name} 被击败！`);
    }
  }

  // 玩家回合结束 -> 处理敌方行动 + 回合维护
  function endPlayerTurn(){
    if(aliveEnemies().length===0){ winBattle(); return; }
    // 敌方行动(按速度，简化为全体依次行动)
    const s = computeStats();
    const order = aliveEnemies().slice().sort((a,b)=> b.spd-a.spd);
    for(const en of order){
      if(en.hp<=0) continue;
      if(en._stun>0){ en._stun--; pushLog(`💫 ${en.name} 被晕眩，无法行动`); continue; }
      if(en._slow>0){ en._slow--; if(Math.random()<0.4){ pushLog(`🌀 ${en.name} 被减速，行动迟缓`); continue; } }
      // 命中/闪避
      if(Math.random()*100 < clamp(s.dodge - 2,3,75)){
        pushLog(`💨 你闪避了 ${en.name} 的攻击`);
        continue;
      }
      const isPhys = en.type==="physical";
      const defStat = isPhys ? s.def : s.mdf;
      let raw = en.atk * rand(0.9,1.15);
      let isCrit = Math.random()*100 < en.crit;
      if(isCrit) raw*=1.6;
      let dmg = calcDamage(raw, defStat, state.level);
      state.hp -= dmg;
      pushLog(`${isCrit?"💢敌暴击！":"👹"} ${en.name} 对你造成 ${dmg} 伤害`);
      if(state.hp<=0){ loseBattle(); return; }
    }
    // DOT结算
    for(const en of battle.enemies){
      if(en.hp>0 && en._dot){
        en.hp -= en._dot.dmg;
        pushLog(`☠️ ${en.name} 受到中毒伤害 ${en._dot.dmg}`);
        en._dot.turns--;
        if(en._dot.turns<=0) en._dot=null;
        checkEnemyDeath(en);
      }
    }
    if(aliveEnemies().length===0){ winBattle(); return; }

    // 玩家buff结算(回血/持续时间)
    if(state._buffs){
      for(const b of state._buffs){
        if(b.add.hpregen){ state.hp=clamp(state.hp+b.add.hpregen,0,s.hp); }
        b.turns--;
      }
      state._buffs = state._buffs.filter(b=>b.turns>0);
    }
    // 角色自身回血(hpregen属性)
    if(s.hpregen>0){ state.hp=clamp(state.hp+Math.round(s.hpregen),0,s.hp); }

    // 冷却递减
    for(const k in battle.cooldowns){ if(battle.cooldowns[k]>0) battle.cooldowns[k]--; }
    battle.turn++;
    save();
  }

  function winBattle(){
    battle.over=true; battle.result="win";
    let xp=0,gold=0;
    for(const en of battle.enemies){ xp+=en.xp; gold+=en.gold; }
    xp = Math.round(xp*1.4); // 经验加成,降低前期枯燥
    // 盗贼天赋:金币加成
    const perk = D.CLASSES[state.classId].perk || {};
    if(perk.gold) gold = Math.round(gold*(1+perk.gold));
    // ===== 掉落系统(每怪独立:材料为主,装备稀有,Boss大爆) =====
    const map = battle.map;
    const drops=[];          // 装备掉落
    const matDrops={};        // 材料 id->数量
    const mf = perk.drop||0;  // Magic Find(盗贼天赋)
    for(const en of battle.enemies){
      // 材料:普通怪主掉
      const matId = D.MONSTER_MAT[en.key];
      if(matId){
        const chance = en.boss?1.0:(en.elite?0.85:0.6);
        if(Math.random()<chance){ const n=en.boss?randi(2,4):randi(1,2); matDrops[matId]=(matDrops[matId]||0)+n; }
      }
      // 普通怪:极低概率掉装备
      if(!en.boss){
        const eqChance = (en.elite?0.30:0.05) + mf;
        if(Math.random()<eqChance){
          const e=genEquip(en.level, map.dropBonus + (en.elite?1:0));
          drops.push(e); addEquip(e);
        }
      }
    }
    // Boss:大爆——必掉多件 + 套装 + 稀有材料 + 小概率"大爆"额外刷一地
    let egg=null;
    if(battle.isBoss){
      const big = Math.random() < 0.10;        // 10%大爆
      const n = (big?randi(4,6):randi(2,3));
      for(let i=0;i<n;i++){ const e=genEquip(map.lv+3, map.dropBonus+2); drops.push(e); addEquip(e); }
      // 套装碎片(45%,大爆必掉)
      if(D.EQ_SETS[map.boss] && (big||Math.random()<0.45)){
        const piece=genSetPiece(map.boss, map.lv+3); if(piece){ drops.push(piece); addEquip(piece); }
      }
      // 稀有材料
      const rareMat=D.MONSTER_MAT_BOSS[map.boss];
      if(rareMat){ matDrops[rareMat]=(matDrops[rareMat]||0)+randi(1,3); }
      // 幸运宝石(强化材料)
      if(Math.random()<0.6){ matDrops.lucky_gem=(matDrops.lucky_gem||0)+randi(1,2); }
      // 宠物蛋
      if(Math.random()<0.25){ egg=hatchEgg(); }
      // 稀有坐骑掉落
      if(!state.mounts.golddragon && Math.random()<0.03){ grantMount("golddragon"); pushLog("🐉 稀有坐骑掉落：黄金地龙！"); }
      else if(!state.mounts.falkner && Math.random()<0.04){ grantMount("falkner"); pushLog("🐴 稀有坐骑掉落：福尔克纳战马！"); }
      if(big) pushLog("✨✨ Boss 大爆发！掉落如雨！");
    }
    // 宝石掉落(精英8%/Boss必出1-2颗)
    let gemDrop=[];
    {
      const isElite=battle.enemies.some(e=>e.elite);
      if(battle.isBoss){ const n=randi(1,2); for(let i=0;i<n;i++) gemDrop.push(rollGem()); }
      else if(isElite && Math.random()<0.5){ gemDrop.push(rollGem()); }
      else if(Math.random()<0.06){ gemDrop.push(rollGem()); }
    }
    // 技能书掉落(精英3%/Boss20%,玩家未学的本职技能)
    let bookDrop=null;
    {
      const maxLv = Math.max(...battle.enemies.map(e=>e.level));
      const isElite = battle.enemies.some(e=>e.elite);
      const bchance = battle.isBoss?0.20:(isElite?0.03:0.004);
      if(Math.random()<bchance){ bookDrop = rollSkillBook(maxLv); }
    }
    // 入袋材料
    for(const id in matDrops){ state.materials[id]=(state.materials[id]||0)+matDrops[id]; }
    state.stats_total.drops += drops.length;
    state.stats_total.kills += battle.enemies.length;
    // 记录击杀(按种类 + 任务进度)
    for(const en of battle.enemies){
      state.killByType[en.key] = (state.killByType[en.key]||0)+1;
      onKill(en.key, map.id);
    }
    state.gold += gold;
    const leveled = gainXp(xp);
    const petLeveled = petGainXp(Math.round(xp*0.6));
    battle.rewards = { xp, gold, drops, matDrops, leveled, egg, petLeveled, bookDrop, gemDrop };
    if(battle.isBoss){
      state.clearedBoss[map.id]=true;
      state.stats_total.bossKills++;
      onBossKill(map.id);
      gainRep(8);
    }
    // 主线objective即时判定 + 称号检测
    refreshQuestStatus();
    const newTitles = checkTitles();
    battle.rewards.newTitles = newTitles;
    pushLog(`🎉 战斗胜利！获得 ${xp} 经验、${gold} 金币`);
    const matNames=Object.keys(matDrops).map(id=>`${D.MATERIALS[id].name}×${matDrops[id]}`);
    if(matNames.length) pushLog(`📦 材料：${matNames.join("、")}`);
    if(drops.length) pushLog(`🎁 掉落 ${drops.length} 件装备`);
    if(bookDrop) pushLog(`📘 掉落技能书：${D.SKILLS[bookDrop].name}！`);
    if(gemDrop.length) pushLog(`💎 宝石：${gemDrop.map(g=>D.GEM_GRADES[g.grade]+D.GEMS[g.key].name).join("、")}`);
    if(egg) pushLog(`🥚 获得宠物：${D.PETS[egg.species].name}！`);
    if(leveled.length) pushLog(`⬆️ 升级到 Lv.${state.level}！`);
    if(petLeveled&&petLeveled.length) pushLog(`🐾 宠物升级到 Lv.${activePetObj().level}！`);
    save();
  }

  function loseBattle(){
    battle.over=true; battle.result="lose";
    state.hp=0;
    state.stats_total.deaths++;
    // 惩罚：损失部分金币
    const lost = Math.round(state.gold*0.1);
    state.gold -= lost;
    battle.rewards = { lost };
    pushLog(`💀 你被击败了…损失 ${lost} 金币，被送回城。`);
    fullRestore();
    state.hp = Math.max(1, Math.floor(computeStats().hp*0.5));
    save();
  }

  function flee(){
    // 50%基础+速度修正 逃跑
    const s = computeStats();
    const enemyspd = aliveEnemies().reduce((m,e)=>Math.max(m,e.spd),0);
    const chance = clamp(0.5 + (s.spd-enemyspd)*0.02, 0.15, 0.9);
    if(battle.isBoss){
      // boss降低逃跑率
    }
    if(Math.random()<chance){
      battle.over=true; battle.result="flee";
      pushLog("🏃 成功逃离战斗");
      save();
      return true;
    } else {
      pushLog("逃跑失败！");
      // 敌人趁机攻击
      const en = aliveEnemies()[0];
      if(en){
        const isPhys = en.type==="physical";
        let dmg = calcDamage(en.atk*rand(0.9,1.1), isPhys?s.def:s.mdf, state.level);
        state.hp-=dmg;
        pushLog(`👹 ${en.name} 趁机造成 ${dmg} 伤害`);
        if(state.hp<=0){ loseBattle(); }
      }
      save();
      return false;
    }
  }

  function useBattleItem(id){
    if(battle.over) return {err:"战斗已结束"};
    if(!(state.items[id]>0)) return {err:"没有该道具"};
    const it = D.CONSUMABLES[id];
    const s = computeStats();
    if(it.escape){
      battle.over=true; battle.result="flee";
      fullRestore();
      state.items[id]--; if(state.items[id]<=0) delete state.items[id];
      pushLog("📜 使用回城卷轴，安全撤离并恢复");
      save();
      return {ok:true, escaped:true};
    }
    if(it.heal) state.hp=clamp(state.hp+it.heal,0,s.hp);
    if(it.mana) state.mp=clamp(state.mp+it.mana,0,s.mp);
    state.items[id]--; if(state.items[id]<=0) delete state.items[id];
    pushLog(`🧪 使用 ${it.name}`);
    endPlayerTurn(); // 使用道具消耗回合
    return {ok:true};
  }

  /* ---------- 自动战斗AI：返回选择的行动 ---------- */
  function autoChooseAction(){
    const s = computeStats();
    // 残血先嗑药
    if(state.hp/s.hp < 0.3){
      for(const pid of ["hp_potion_l","hp_potion_m","hp_potion_s"]){
        if(state.items[pid]>0) return {type:"item", id:pid};
      }
      // 牧师/圣骑士自疗
      for(const hs of ["heal","lay_on_hands"]){
        if(state.learned[hs] && (battle.cooldowns[hs]||0)<=0 && state.mp>=D.SKILLS[hs].mp)
          return {type:"skill", id:hs};
      }
    }
    // 选可用最强攻击技能
    const usable = classSkillList().filter(sk=>{
      const d=D.SKILLS[sk];
      return state.learned[sk] && d.type!=="heal" && (battle.cooldowns[sk]||0)<=0 && state.mp>=d.mp;
    });
    // 多敌时优先aoe
    const multi = aliveEnemies().length>1;
    usable.sort((a,b)=>{
      const da=D.SKILLS[a], db=D.SKILLS[b];
      const sa=(da.power||1)*(da.aoe&&multi?2:1)*(da.type==="buff"?0.2:1);
      const sb=(db.power||1)*(db.aoe&&multi?2:1)*(db.type==="buff"?0.2:1);
      return sb-sa;
    });
    // 偶尔上buff
    const buff = usable.find(sk=>D.SKILLS[sk].type==="buff");
    if(buff && battle.turn===0 && Math.random()<0.8) return {type:"skill", id:buff};
    const atkSkill = usable.find(sk=>D.SKILLS[sk].type!=="buff");
    if(atkSkill) return {type:"skill", id:atkSkill};
    return {type:"attack"};
  }

  /* ---------- 地图解锁判定 ---------- */
  function mapUnlocked(map){
    if(!map.unlock) return true;
    const prereq = D.MAPS.find(m=>m.id===map.unlock);
    // 前置地图没有Boss时(纯刷怪图),视为已通过
    if(prereq && !prereq.boss) return true;
    return !!state.clearedBoss[map.unlock];
  }

  /* ============================================================
   *  任务系统
   * ============================================================ */
  function currentMainQuest(){
    if(state.quests.mainIdx >= D.MAIN_QUESTS.length) return null;
    return D.MAIN_QUESTS[state.quests.mainIdx];
  }

  // 职业任务链
  function currentClassQuest(){
    const chain = D.CLASS_QUESTS[state.classId]||[];
    if(state.quests.classIdx >= chain.length) return null;
    return chain[state.quests.classIdx];
  }

  // 击杀事件：推进 kill / killType 类目标
  function onKill(monsterKey, mapId){
    // 主线
    const mq = currentMainQuest();
    if(mq){ bumpQuestKill(mq, monsterKey, mapId); }
    // 职业线
    const cq = currentClassQuest();
    if(cq){ bumpQuestKill(cq, monsterKey, mapId); }
    // 支线
    for(const sid in state.quests.sideActive){
      const sq = D.SIDE_QUESTS.find(q=>q.id===sid);
      if(sq) bumpQuestKill(sq, monsterKey, mapId, true);
    }
  }
  function bumpQuestKill(q, monsterKey, mapId, isSide){
    const o=q.objective;
    let hit=false;
    if(o.kind==="kill" && o.mapId===mapId) hit=true;
    else if(o.kind==="killType" && o.monster===monsterKey) hit=true;
    if(!hit) return;
    if(isSide){ state.quests.sideActive[q.id].prog = (state.quests.sideActive[q.id].prog||0)+1; }
    else { state.quests.progress[q.id]=(state.quests.progress[q.id]||0)+1; }
  }
  function onBossKill(mapId){
    const mq=currentMainQuest();
    if(mq && mq.objective.kind==="boss" && mq.objective.mapId===mapId){
      state.quests.progress[mq.id]=1;
    }
    const cq=currentClassQuest();
    if(cq && cq.objective.kind==="boss" && cq.objective.mapId===mapId){
      state.quests.progress[cq.id]=1;
    }
    for(const sid in state.quests.sideActive){
      const sq=D.SIDE_QUESTS.find(q=>q.id===sid);
      if(sq && sq.objective.kind==="boss" && sq.objective.mapId===mapId)
        state.quests.sideActive[sid].prog=1;
    }
  }

  // 计算任务当前进度/目标 与 是否完成
  function questProgress(q, isSide){
    const o=q.objective;
    let cur=0, need=1;
    switch(o.kind){
      case "kill": case "killType":
        need=o.count;
        cur = isSide ? (state.quests.sideActive[q.id]?.prog||0) : (state.quests.progress[q.id]||0);
        break;
      case "boss":
        need=1;
        cur = (isSide? state.quests.sideActive[q.id]?.prog : state.quests.progress[q.id]) ? 1 : (state.clearedBoss[o.mapId]?1:0);
        break;
      case "level": need=o.count; cur=Math.min(state.level,o.count); break;
      case "gold":  need=o.count; cur=Math.min(state.gold,o.count); break;
      case "equipPower":
        need=o.count;
        cur = bestEquipPower()>=o.count ? o.count : bestEquipPower();
        break;
    }
    return { cur, need, done: cur>=need };
  }
  function bestEquipPower(){
    let m=0;
    for(const slot in state.equip){ if(state.equip[slot]) m=Math.max(m,state.equip[slot].power); }
    for(const e of state.bag){ m=Math.max(m,e.power); }
    return m;
  }

  function refreshQuestStatus(){
    const mq=currentMainQuest();
    if(mq){ state.quests.mainDone = questProgress(mq,false).done; }
  }

  function objectiveText(q){
    const o=q.objective;
    const M = id => (D.MAPS.find(m=>m.id===id)||{}).name||id;
    switch(o.kind){
      case "kill": return `在【${M(o.mapId)}】击败任意怪物 ${o.count} 只`;
      case "killType": return `击败【${D.MONSTERS[o.monster].name}】${o.count} 只`;
      case "boss": return `击败【${M(o.mapId)}】的Boss ${D.MONSTERS[D.MAPS.find(m=>m.id===o.mapId).boss].name}`;
      case "level": return `角色等级达到 Lv.${o.count}`;
      case "gold": return `累计持有 ${o.count} 金币`;
      case "equipPower": return `获得一件战力≥${o.count}的装备`;
    }
    return "";
  }

  function giveReward(r){
    if(r.xp) gainXp(r.xp);
    if(r.gold) state.gold += r.gold;
    if(r.diamond) state.diamond += r.diamond;
    if(r.item){ state.items[r.item.id]=(state.items[r.item.id]||0)+r.item.count; }
  }

  // 领取主线奖励 -> 推进下一章
  function claimMainQuest(){
    const mq=currentMainQuest();
    if(!mq) return false;
    if(!questProgress(mq,false).done) return false;
    giveReward(mq.reward);
    gainRep(25);
    state.quests.mainIdx++;
    state.quests.mainDone=false;
    refreshQuestStatus();
    checkTitles();
    save();
    return mq;
  }

  // 职业任务:是否达到接取等级
  function classQuestReady(){
    const cq=currentClassQuest();
    return cq && state.level>=cq.reqLevel;
  }
  function claimClassQuest(){
    const cq=currentClassQuest();
    if(!cq) return false;
    if(state.level < cq.reqLevel) return false;
    if(!questProgress(cq,false).done) return false;
    giveReward(cq.reward);
    gainRep(15);
    state.quests.classIdx++;
    save();
    return cq;
  }

  // 接取支线
  function acceptSide(sid){
    const sq=D.SIDE_QUESTS.find(q=>q.id===sid);
    if(!sq) return false;
    if(state.quests.sideActive[sid]) return false;
    if(state.level < sq.reqLevel) return false;
    if(state.quests.sideDone[sid] && !sq.repeatable) return false;
    state.quests.sideActive[sid]={prog:0};
    save();
    return true;
  }
  function claimSide(sid){
    const sq=D.SIDE_QUESTS.find(q=>q.id===sid);
    if(!sq || !state.quests.sideActive[sid]) return false;
    if(!questProgress(sq,true).done) return false;
    giveReward(sq.reward);
    gainRep(10);
    state.quests.sideDone[sid]=(state.quests.sideDone[sid]||0)+1;
    delete state.quests.sideActive[sid];
    save();
    return sq;
  }
  // 可接取的支线(满足等级、未在进行、(可重复 或 未完成))
  function availableSides(){
    return D.SIDE_QUESTS.filter(sq=>{
      if(state.quests.sideActive[sq.id]) return false;
      if(state.level < sq.reqLevel) return false;
      if(state.quests.sideDone[sq.id] && !sq.repeatable) return false;
      return true;
    });
  }

  /* ---------- 存档 ---------- */
  function save(){
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){}
  }
  function load(){
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      if(!raw) return false;
      state = JSON.parse(raw);
      // 旧存档职业已不存在 -> 视为无效,强制重建角色
      if(!D.CLASSES[state.classId]){ state=null; return false; }
      // 兼容字段
      state._buffs = [];
      if(!state.stats_total) state.stats_total={kills:0,deaths:0,bossKills:0,drops:0};
      if(!state.quests) state.quests={mainIdx:0,mainDone:false,classIdx:0,sideActive:{},sideDone:{},progress:{}};
      if(state.quests.classIdx===undefined) state.quests.classIdx=0;
      if(!state.killByType) state.killByType={};
      if(!state.materials) state.materials={};
      if(!state.gems) state.gems={};
      if(!state.books) state.books={};
      if(!state.advance) state.advance={t1:null,t2:null};
      if(!state.pets) state.pets=[];
      if(state.activePet===undefined) state.activePet=null;
      if(!state.signin) state.signin={last:null,total:0};
      if(!state.titles) state.titles={};
      if(state.activeTitle===undefined) state.activeTitle=null;
      if(!state.mounts) state.mounts={};
      if(state.activeMount===undefined) state.activeMount=null;
      if(state.rep===undefined) state.rep=0;
      if(!state.life) state.life={gather:0,alchemy:0,smith:0,lockpick:0};
      return true;
    }catch(e){ return false; }
  }
  function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }
  function wipe(){ localStorage.removeItem(SAVE_KEY); state=null; battle=null; }
  function exportSave(){ return btoa(unescape(encodeURIComponent(JSON.stringify(state)))); }
  function importSave(str){
    try{ const o=JSON.parse(decodeURIComponent(escape(atob(str)))); state=o; state._buffs=[]; save(); return true; }
    catch(e){ return false; }
  }

  /* ---------- 公开接口 ---------- */
  return {
    get state(){ return state; },
    get battle(){ return battle; },
    D,
    newGame, load, hasSave, wipe, save, exportSave, importSave,
    computeStats, effectivePrimary, fullRestore, clampVitals,
    genEquip, addEquip, equipItem, unequip, sellEquip, equipPower, canEquip, setBonusInfo,
    enhanceStatOf, enhanceEquip, socketGem, pandoraCombine, findEquipById, effPower,
    buyItem, useConsumable,
    gainXp, allocate, resetPoints, rebuildSkillSlots, classSkillList,
    bookSkills, skillBookPrice, buySkillBook, learnSkillBook,
    startBattle, playerAction, flee, useBattleItem, autoChooseAction,
    mapUnlocked,
    // 随机奇遇
    rollEncounter, applyEncounter, startEliteBattle,
    // 任务
    currentMainQuest, questProgress, objectiveText, refreshQuestStatus,
    claimMainQuest, acceptSide, claimSide, availableSides,
    currentClassQuest, classQuestReady, claimClassQuest,
    // 转职 / 被动
    advanceInfo, pendingAdvance, doAdvance, classTitle, activePassives,
    // 称号 / 坐骑 / 声望
    checkTitles, setTitle, titleBonus, buyMount, setMount, grantMount, mountBonus,
    repTier, repDiscount, repNext, discountPrice, gainRep,
    // 生活技能
    lifeTierIdx, lifeTierName, gatherMap, craftAlchemy, craftSmith,
    // 宠物
    petStats, activePetObj, petPassive, hatchEgg, setActivePet, buyPetEgg, releasePet, petXpToNext,
    // 签到
    canSignIn, signinDayIndex, doSignIn, todayStr,
    // helpers
    rand, randi, pick, clamp,
  };
})();
