/* ============================================================
 *  幻境online — UI 渲染层
 * ============================================================ */

const UI = (() => {
  const D = GameData;
  const E = Engine;
  const $ = sel => document.querySelector(sel);
  const screen = () => $("#screen");
  let current = "map";

  /* ---------- 通用 ---------- */
  function toast(msg, type="info"){
    const wrap = $("#toast-wrap");
    const el = document.createElement("div");
    el.className = "toast "+type;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(()=>{ el.classList.add("show"); },10);
    setTimeout(()=>{ el.classList.remove("show"); setTimeout(()=>el.remove(),300); }, 2200);
  }

  function rColor(r){ return D.RARITY[r].color; }

  function statLine(stats){
    return D.STAT_KEYS.filter(k=>stats[k]).map(k=>{
      const v = stats[k];
      const pct = D.PERCENT_STATS.has(k)?"%":"";
      return `<span class="stat">${D.STAT_NAME[k]} +${v}${pct}</span>`;
    }).join("");
  }

  function eqTypeLabel(e){
    if(e.weaponType) return D.WEAPON_TYPES[e.weaponType].name;
    if(e.armorType) return D.ARMOR_TYPES[e.armorType].name;
    return "饰品";
  }
  function eqRestrictLabel(e){
    if(e.weaponType) return D.WEAPON_TYPES[e.weaponType].classes.map(c=>D.CLASSES[c].name).join("/");
    if(e.armorType) return D.ARMOR_TYPES[e.armorType].classes.map(c=>D.CLASSES[c].name).join("/");
    return "通用";
  }
  function equipCard(e, actions, extraTag){
    const wearable = E.canEquip(e);
    const plus = e.plus?` <span class="plus-tag">+${e.plus}</span>`:'';
    const gemInfo = e.sockets?` · 凹槽${(e.gems||[]).length}/${e.sockets}`:'';
    return `<div class="eq-card" style="border-color:${rColor(e.rarity)}">
      <div class="eq-head">
        <span class="eq-name" style="color:${rColor(e.rarity)}">${D.SLOTS[e.slot].icon} ${e.name}${plus}${e.setName?' <span class="set-tag">套装</span>':''}</span>
        <span class="eq-meta">${D.RARITY[e.rarity].name} · Lv${e.level} · 战力${e.power}</span>
      </div>
      <div class="eq-sub">${eqTypeLabel(e)} · 限<b class="${wearable?'':'no-wear'}">${eqRestrictLabel(e)}</b>${gemInfo}</div>
      <div class="eq-stats">${statLine(e.stats)}${gemLine(e)}</div>
      ${actions||""}
    </div>`;
  }
  function gemLine(e){
    if(!e.gems||!e.gems.length) return "";
    return `<div class="gem-line">${e.gems.map(g=>`<span class="stat">💎${D.GEMS[g.key].name} +${D.GEMS[g.key].vals[g.grade]}${D.PERCENT_STATS.has(D.GEMS[g.key].stat)?'%':''}</span>`).join("")}</div>`;
  }

  /* ============================================================
   *  顶部状态栏刷新
   * ============================================================ */
  function refreshTop(){
    const st = E.state; if(!st) return;
    const s = E.computeStats();
    $("#topbar").classList.remove("hidden");
    $("#navbar").classList.remove("hidden");
    const titleTxt = st.activeTitle&&D.TITLES[st.activeTitle] ? `【${D.TITLES[st.activeTitle].name}】` : "";
    $("#hero-name").textContent = titleTxt + st.name;
    const cls = D.CLASSES[st.classId];
    $("#hero-class").textContent = cls.icon+E.classTitle();
    $("#hero-lv").textContent = "Lv."+st.level;
    setBar("#hp-fill","#hp-text", st.hp, s.hp);
    setBar("#mp-fill","#mp-text", st.mp, s.mp);
    const need = st.level>=D.MAX_LEVEL? 1 : D.xpToNext(st.level);
    setBar("#xp-fill","#xp-text", st.xp, need, st.level>=D.MAX_LEVEL?"MAX":null);
    $("#gold").textContent = st.gold;
    $("#diamond").textContent = st.diamond;
    const pb = $("#point-badge");
    if(st.freePoints>0){ pb.classList.remove("hidden"); $("#free-points").textContent=st.freePoints; }
    else pb.classList.add("hidden");
  }
  function setBar(fill,text,cur,max,override){
    const pct = max>0? Math.max(0,Math.min(100, cur/max*100)) : 0;
    $(fill).style.width = pct+"%";
    $(text).textContent = override || `${Math.floor(cur)}/${Math.floor(max)}`;
  }

  /* ============================================================
   *  路由
   * ============================================================ */
  function go(view){
    current = view;
    document.querySelectorAll("#navbar button").forEach(b=>{
      b.classList.toggle("active", b.dataset.nav===view);
    });
    refreshTop();
    ({ quest:renderQuest, map:renderMap, hero:renderHero, bag:renderBag, skill:renderSkill, pet:renderPet, town:renderTown, sys:renderSys })[view]();
    screen().scrollTop=0;
  }

  /* ============================================================
   *  任务
   * ============================================================ */
  function rewardText(r){
    const parts=[];
    if(r.xp) parts.push(`经验+${r.xp}`);
    if(r.gold) parts.push(`金币+${r.gold}`);
    if(r.diamond) parts.push(`信用点+${r.diamond}`);
    if(r.item) parts.push(`${D.CONSUMABLES[r.item.id].name}×${r.item.count}`);
    if(r.freePoints) parts.push(`属性点+${r.freePoints}`);
    if(r.rep) parts.push(`声望+${r.rep}`);
    if(r.mount) parts.push(`坐骑·${D.MOUNTS[r.mount].name}`);
    if(r.petEgg) parts.push(`宠物蛋`);
    if(r.gem) parts.push(`${D.GEM_GRADES[r.gem.grade]}${D.GEMS[r.gem.key].name}×${r.gem.n||1}`);
    return parts.join("　");
  }
  function progBar(cur,need){
    const pct=Math.min(100,cur/need*100);
    return `<div class="qbar"><div class="qbar-fill" style="width:${pct}%"></div><span>${Math.min(cur,need)}/${need}</span></div>`;
  }

  function renderQuest(){
    const st=E.state;
    let html=`<h2 class="title">📜 任务</h2>`;

    // ---- 主线 ----
    const mq=E.currentMainQuest();
    html+=`<div class="panel quest-main"><h3>⭐ 主线剧情 <small>第 ${Math.min(st.quests.mainIdx+1,D.MAIN_QUESTS.length)}/${D.MAIN_QUESTS.length} 章</small></h3>`;
    if(!mq){
      html+=`<div class="quest-card done"><div class="q-chapter">终章已完成 · 教皇加冕</div>
        <p class="q-story">你集齐了秩序之章,大天使泰洛德在卡罗尔城神圣殿堂为你加冕。亚特兰大陆迎来久违的光明——孤寂的行者,你的赞歌已传遍大陆。</p>
        <p class="q-finish">🏆 恭喜通关全部主线!可继续刷高级地图、打Boss、做职业线与支线,冲击满级。</p></div>`;
    } else {
      const p=E.questProgress(mq,false);
      html+=`<div class="quest-card ${p.done?'ready':''}">
        <div class="q-chapter">${mq.chapter}</div>
        <div class="q-name">${mq.name}</div>
        <div class="q-giver">委托人：${mq.giver}</div>
        <p class="q-story">${mq.story}</p>
        <div class="q-obj">目标：${E.objectiveText(mq)}</div>
        ${progBar(p.cur,p.need)}
        <div class="q-reward">奖励：${rewardText(mq.reward)}</div>
        ${p.done
          ? `<button class="btn small" data-claim-main="1">✓ 领取奖励 · 推进剧情</button>`
          : `<div class="q-tip">完成目标后回此领取奖励</div>`}
      </div>`;
    }
    html+=`</div>`;

    // ---- 职业任务链 ----
    const cq=E.currentClassQuest();
    const cls=D.CLASSES[st.classId];
    const chain=D.CLASS_QUESTS[st.classId]||[];
    html+=`<div class="panel quest-class"><h3>${cls.icon} ${cls.name}·职业任务 <small>第 ${Math.min(st.quests.classIdx+1,chain.length)}/${chain.length} 环</small></h3>`;
    if(!cq){
      html+=`<div class="quest-card done"><p class="q-finish">🏆 职业任务全部完成,你已是真正的${E.classTitle()}!</p></div>`;
    } else if(st.level < cq.reqLevel){
      html+=`<div class="quest-card"><div class="q-name">${cq.title} <small>${cq.giver}</small></div>
        <div class="q-tip">🔒 需达到 Lv.${cq.reqLevel} 接取</div></div>`;
    } else {
      const p=E.questProgress(cq,false);
      html+=`<div class="quest-card ${p.done?'ready':''}">
        <div class="q-name">${cq.title} <small>${cq.giver}</small></div>
        <p class="q-story">${cq.story}</p>
        <div class="q-obj">目标：${E.objectiveText(cq)}</div>
        ${progBar(p.cur,p.need)}
        <div class="q-reward">奖励：${rewardText(cq.reward)}</div>
        ${p.done?`<button class="btn small" data-claim-class="1">✓ 领取奖励 · 推进职业线</button>`:`<div class="q-tip">完成目标后回此领取</div>`}
      </div>`;
    }
    html+=`</div>`;

    // ---- 隐藏任务 ----
    E.checkHidden();
    const hidden=E.availableHidden();
    if(hidden.length){
      html+=`<div class="panel quest-hidden"><h3>🕯️ 隐藏任务 <small>${hidden.length}</small></h3>`;
      for(const q of hidden){
        const p=E.hiddenProgress(q);
        html+=`<div class="quest-card hidden ${p.done?'ready':''}">
          <div class="q-name">${q.name} <small>${q.npc}</small></div>
          <p class="q-story">${q.story}</p>
          <div class="q-obj">目标：${E.objectiveText(q)}</div>
          ${progBar(p.cur,p.need)}
          <div class="q-reward">奖励：${rewardText(q.reward)}${q.repeatable?' <span class="repeat">可重复</span>':''}</div>
          ${p.done?`<button class="btn small" data-claim-hidden="${q.id}">✓ 领取奖励</button>`:`<div class="q-tip">进行中…</div>`}
        </div>`;
      }
      html+=`</div>`;
    }

    // ---- 进行中的支线 ----
    const activeSides=Object.keys(st.quests.sideActive);
    if(activeSides.length){
      html+=`<div class="panel"><h3>📌 进行中的支线</h3>`;
      for(const sid of activeSides){
        const sq=D.SIDE_QUESTS.find(q=>q.id===sid);
        const p=E.questProgress(sq,true);
        html+=`<div class="quest-card side ${p.done?'ready':''}">
          <div class="q-name">${sq.name} <small>${sq.giver}</small></div>
          <div class="q-obj">目标：${E.objectiveText(sq)}</div>
          ${progBar(p.cur,p.need)}
          <div class="q-reward">奖励：${rewardText(sq.reward)}</div>
          ${p.done?`<button class="btn small" data-claim-side="${sid}">✓ 领取奖励</button>`:`<div class="q-tip">进行中…</div>`}
        </div>`;
      }
      html+=`</div>`;
    }

    // ---- 可接取支线 ----
    const avail=E.availableSides();
    html+=`<div class="panel"><h3>📋 可接取的支线 <small>${avail.length}</small></h3>`;
    if(!avail.length){
      html+=`<p class="hint">暂无可接支线，提升等级或推进地图解锁更多委托。</p>`;
    }
    for(const sq of avail){
      const M=(D.MAPS.find(m=>m.id===sq.region)||{}).name||"";
      html+=`<div class="quest-card side">
        <div class="q-name">${sq.name} <small>${sq.giver} · ${M}</small></div>
        <p class="q-story">${sq.story}</p>
        <div class="q-obj">目标：${E.objectiveText(sq)}</div>
        <div class="q-reward">奖励：${rewardText(sq.reward)} ${sq.repeatable?'<span class="repeat">可重复</span>':''}</div>
        <button class="btn small" data-accept="${sq.id}">接取任务</button>
      </div>`;
    }
    html+=`</div>`;
    screen().innerHTML=html;

    const cm=screen().querySelector("[data-claim-main]");
    if(cm) cm.onclick=()=>{
      const q=E.claimMainQuest();
      if(q){ toast(`完成「${q.name}」! ${rewardText(q.reward)}`,"good"); refreshTop(); renderQuest(); }
    };
    const cc=screen().querySelector("[data-claim-class]");
    if(cc) cc.onclick=()=>{
      const q=E.claimClassQuest();
      if(q){ toast(`完成「${q.title}」! ${rewardText(q.reward)}`,"good"); refreshTop(); renderQuest(); }
    };
    screen().querySelectorAll("[data-claim-hidden]").forEach(b=>b.onclick=()=>{
      const q=E.claimHidden(b.dataset.claimHidden);
      if(q){ toast(`完成隐藏任务「${q.name}」! ${rewardText(q.reward)}`,"good"); refreshTop(); renderQuest(); }
    });
    screen().querySelectorAll("[data-claim-side]").forEach(b=>b.onclick=()=>{
      const q=E.claimSide(b.dataset.claimSide);
      if(q){ toast(`完成「${q.name}」! ${rewardText(q.reward)}`,"good"); refreshTop(); renderQuest(); }
    });
    screen().querySelectorAll("[data-accept]").forEach(b=>b.onclick=()=>{
      if(E.acceptSide(b.dataset.accept)){ toast("已接取任务","good"); renderQuest(); }
    });
  }

  /* ============================================================
   *  地图
   * ============================================================ */
  function renderMap(){
    const st = E.state;
    let html = `<h2 class="title">🗺️ 世界地图</h2>`;
    html += `<p class="hint">选择地图刷怪、打Boss解锁后续区域。推荐等级越高怪物越强、掉落越好。</p>`;
    for(const map of D.MAPS){
      const unlocked = E.mapUnlocked(map);
      const cleared = st.clearedBoss[map.id];
      html += `<div class="map-card ${unlocked?'':'locked'}">
        <div class="map-top">
          <span class="map-name">${map.icon} ${map.name}</span>
          <span class="map-lv">推荐 Lv.${map.lv} ${cleared?'<span class="cleared">✔已通关</span>':''}</span>
        </div>`;
      if(unlocked){
        html += `<div class="map-mons">出没：${map.monsters.map(k=>D.MONSTERS[k].icon+D.MONSTERS[k].name).join(" ")}</div>`;
        html += `<div class="map-actions">
          <button class="btn" data-act="fight" data-map="${map.id}">🗡️ 刷怪</button>
          <button class="btn small" data-act="gather" data-map="${map.id}">🌿 采集</button>`;
        if(map.boss){
          html += `<button class="btn boss" data-act="boss" data-map="${map.id}">👑 挑战Boss（${D.MONSTERS[map.boss].name}）</button>`;
        }
        html += `</div>`;
      } else {
        const req = D.MAPS.find(m=>m.id===map.unlock);
        html += `<div class="map-locked">🔒 需先通关「${req?req.name:''}」</div>`;
      }
      html += `</div>`;
    }
    screen().innerHTML = html;
    screen().querySelectorAll("[data-act]").forEach(b=>{
      b.onclick = ()=>{
        const mapId=b.dataset.map;
        if(b.dataset.act==="gather"){
          const r=E.gatherMap(mapId);
          if(r&&r.got){ toast("采集到:"+Object.keys(r.got).map(id=>D.MATERIALS[id].name+"×"+r.got[id]).join("、"),"good"); }
          return;
        }
        Main.enterBattle(mapId, b.dataset.act==="boss");
      };
    });
  }

  /* ============================================================
   *  战斗界面
   * ============================================================ */
  function renderBattle(){
    const b = E.battle, st = E.state;
    const s = E.computeStats();
    if(!b) return;
    let html = `<div class="battle">`;
    // 敌人区
    html += `<div class="enemies">`;
    b.enemies.forEach((en,i)=>{
      const dead = en.hp<=0;
      const pct = Math.max(0, en.hp/en.maxhp*100);
      html += `<div class="enemy ${dead?'dead':''} ${en.boss?'boss':''} ${en.elite?'elite':''}" data-ei="${i}">
        <div class="enemy-icon">${en.icon}</div>
        <div class="enemy-name">${en.name} <small>Lv${en.level}</small></div>
        <div class="ebar"><div class="ebar-fill" style="width:${pct}%"></div></div>
        <div class="ehp">${Math.max(0,Math.ceil(en.hp))}/${en.maxhp}</div>
        ${en._dot?'<span class="dot-mark">☠️</span>':''}
      </div>`;
    });
    html += `</div>`;

    // 玩家血条
    html += `<div class="player-vitals">
      <div class="pv"><span>HP</span><div class="pbar"><div class="pbar-fill hp" style="width:${st.hp/s.hp*100}%"></div></div><span>${Math.floor(st.hp)}/${s.hp}</span></div>
      <div class="pv"><span>MP</span><div class="pbar"><div class="pbar-fill mp" style="width:${st.mp/s.mp*100}%"></div></div><span>${Math.floor(st.mp)}/${s.mp}</span></div>
    </div>`;

    // 战斗日志
    html += `<div class="battle-log" id="blog">${b.log.slice(-8).map(l=>`<div>${l}</div>`).join("")}</div>`;

    // 结束态
    if(b.over){
      html += renderBattleResult();
    } else {
      // 行动按钮
      html += `<div class="actions-grid">`;
      html += `<button class="abtn attack" data-skill="attack">🗡️ 普通攻击</button>`;
      for(const sk of st.skillSlots){
        const d = D.SKILLS[sk];
        const cd = b.cooldowns[sk]||0;
        const noMp = st.mp < d.mp;
        const dis = cd>0||noMp;
        html += `<button class="abtn ${dis?'dis':''}" data-skill="${sk}" ${dis?'disabled':''}>
          ${d.name} ${d.mp?`<small>${d.mp}MP</small>`:''} ${cd>0?`<small>CD${cd}</small>`:''}
        </button>`;
      }
      html += `</div>`;
      // 道具与逃跑
      html += `<div class="battle-bottom">`;
      const heals = Object.keys(st.items).filter(id=>st.items[id]>0 && (D.CONSUMABLES[id].heal||D.CONSUMABLES[id].mana||D.CONSUMABLES[id].escape));
      html += `<select id="battle-item"><option value="">使用道具…</option>${heals.map(id=>`<option value="${id}">${D.CONSUMABLES[id].name} x${st.items[id]}</option>`).join("")}</select>`;
      html += `<button class="btn small" id="use-item">使用</button>`;
      html += `<button class="btn small" id="auto-toggle">${st.autoBattle?'⏸ 关闭自动':'▶ 自动战斗'}</button>`;
      html += `<button class="btn small flee" id="flee-btn">🏃 逃跑</button>`;
      html += `</div>`;
      html += `<p class="hint">点击上方敌人可切换目标（单体技能）。当前目标：<b id="cur-target">${currentTargetName()}</b></p>`;
    }
    html += `</div>`;
    screen().innerHTML = html;
    bindBattle();
    const blog = $("#blog"); if(blog) blog.scrollTop = blog.scrollHeight;
    refreshTop();
  }

  let targetIndex = 0;
  function currentTargetName(){
    const b=E.battle; if(!b) return "";
    if(!b.enemies[targetIndex] || b.enemies[targetIndex].hp<=0){
      const a = b.enemies.findIndex(e=>e.hp>0);
      targetIndex = a<0?0:a;
    }
    return b.enemies[targetIndex]?.name||"";
  }

  function bindBattle(){
    const b = E.battle;
    screen().querySelectorAll(".enemy").forEach(el=>{
      el.onclick=()=>{
        const i=+el.dataset.ei;
        if(b.enemies[i].hp>0){ targetIndex=i; const ct=$("#cur-target"); if(ct) ct.textContent=b.enemies[i].name;
          screen().querySelectorAll(".enemy").forEach(x=>x.classList.remove("targeted"));
          el.classList.add("targeted"); }
      };
    });
    screen().querySelectorAll(".abtn").forEach(btn=>{
      if(btn.disabled) return;
      btn.onclick=()=> Main.playerTurn(btn.dataset.skill, targetIndex);
    });
    const ui=$("#use-item"); if(ui) ui.onclick=()=>{
      const id=$("#battle-item").value; if(!id){toast("请选择道具");return;}
      Main.useBattleItem(id);
    };
    const at=$("#auto-toggle"); if(at) at.onclick=()=> Main.toggleAuto();
    const fb=$("#flee-btn"); if(fb) fb.onclick=()=> Main.fleeBattle();
  }

  function renderBattleResult(){
    const b=E.battle;
    let html = `<div class="result ${b.result}">`;
    if(b.result==="win"){
      html += `<h3>🎉 胜利！</h3>`;
      html += `<p>经验 +${b.rewards.xp}　金币 +${b.rewards.gold}</p>`;
      if(b.rewards.leveled&&b.rewards.leveled.length) html+=`<p class="lvup">⬆️ 升级到 Lv.${E.state.level}！获得属性点</p>`;
      if(b.rewards.egg){ const sp=D.PETS[b.rewards.egg.species]; html+=`<p class="lvup">🥚 获得宠物：${sp.icon} ${sp.name}！前往「宠物」查看</p>`; }
      if(b.rewards.petLeveled&&b.rewards.petLeveled.length){ const pet=E.activePetObj(); html+=`<p>🐾 宠物升级到 Lv.${pet?pet.level:''}</p>`; }
      if(b.rewards.matDrops&&Object.keys(b.rewards.matDrops).length){
        html+=`<p class="mat-drop">📦 ${Object.keys(b.rewards.matDrops).map(id=>`${D.MATERIALS[id].icon}${D.MATERIALS[id].name}×${b.rewards.matDrops[id]}`).join("　")}</p>`;
      }
      if(b.rewards.bookDrop){ html+=`<p class="lvup">📘 技能书：${D.SKILLS[b.rewards.bookDrop].name}！到技能页学习</p>`; }
      if(b.rewards.gemDrop&&b.rewards.gemDrop.length){ html+=`<p class="mat-drop">💎 ${b.rewards.gemDrop.map(g=>D.GEM_GRADES[g.grade]+D.GEMS[g.key].name).join("　")}</p>`; }
      if(b.rewards.newTitles&&b.rewards.newTitles.length){ html+=`<p class="lvup">🏅 获得称号：${b.rewards.newTitles.map(id=>D.TITLES[id].name).join("、")}！</p>`; }
      if(b.rewards.newHidden&&b.rewards.newHidden.length){ html+=`<p class="lvup">🕯️ 发现隐藏任务：${b.rewards.newHidden.map(id=>D.HIDDEN_QUESTS.find(q=>q.id===id).name).join("、")}！(任务页查看)</p>`; }
      if(b.rewards.drops&&b.rewards.drops.length){
        html += `<div class="drops"><b>掉落 ${b.rewards.drops.length} 件：</b>`;
        for(const e of b.rewards.drops){ const w=E.canEquip(e); html += equipCard(e, w?`<button class="btn small" data-equip="${e.id}">装备</button>`:`<button class="btn small" disabled>职业不符</button>`); }
        html += `</div>`;
      }
    } else if(b.result==="lose"){
      html += `<h3>💀 战败</h3><p>损失 ${b.rewards.lost||0} 金币，已半血复活回城。</p>`;
    } else {
      html += `<h3>🏃 已撤离战斗</h3>`;
    }
    html += `<div class="result-actions">`;
    if(b.result==="win" && !b.isBoss){
      html += `<button class="btn" id="again">↻ 再来一波</button>`;
    }
    html += `<button class="btn" id="back-map">返回地图</button></div>`;
    html += `</div>`;
    // 绑定在bindBattle之后单独处理
    setTimeout(()=>{
      const ag=$("#again"); if(ag) ag.onclick=()=> Main.enterBattle(b.map.id,false);
      const bm=$("#back-map"); if(bm) bm.onclick=()=>{ Main.leaveBattle(); };
      screen().querySelectorAll("[data-equip]").forEach(btn=>{
        btn.onclick=()=>{ if(E.equipItem(btn.dataset.equip)){ toast("已装备","good"); btn.disabled=true; btn.textContent="已装备"; refreshTop(); } };
      });
    },0);
    return html;
  }

  /* ============================================================
   *  角色面板
   * ============================================================ */
  function renderHero(){
    const st=E.state, s=E.computeStats(), p=E.effectivePrimary();
    const cls=D.CLASSES[st.classId];
    let html=`<h2 class="title">${cls.icon} ${st.name} <small>${cls.name} · ${cls.role}</small></h2>`;

    // 主属性加点
    html += `<div class="panel"><h3>主属性 ${st.freePoints>0?`<span class="badge">可用点 ${st.freePoints}</span>`:''}</h3>`;
    html += `<div class="primary-grid">`;
    for(const k of ["str","agi","int","vit"]){
      html += `<div class="prim">
        <span class="prim-name">${D.PRIMARY[k].name}</span>
        <span class="prim-val">${p[k]}</span>
        <button class="btn tiny" data-alloc="${k}" ${st.freePoints<=0?'disabled':''}>+</button>
        <div class="prim-desc">${D.PRIMARY[k].desc}</div>
      </div>`;
    }
    html += `</div>`;
    html += `<button class="btn small" id="reset-pts">洗点（${50+st.level*5}金币）</button>`;
    html += `</div>`;

    // 转职
    html += renderAdvanceSection();

    // 称号
    html += renderTitleSection();

    // 二级属性
    html += `<div class="panel"><h3>战斗属性</h3><div class="stat-grid">`;
    for(const k of D.STAT_KEYS){
      const pct=D.PERCENT_STATS.has(k)?"%":"";
      html += `<div class="stat-row"><span>${D.STAT_NAME[k]}</span><b>${s[k]}${pct}</b></div>`;
    }
    html += `</div></div>`;

    // 套装加成状态
    const setCount=E.setBonusInfo();
    if(Object.keys(setCount).length){
      html += `<div class="panel"><h3>套装加成</h3>`;
      for(const key in setCount){
        const set=D.EQ_SETS[key], n=setCount[key];
        const tiers=Object.keys(set.setBonus||{}).map(Number).sort((a,b)=>a-b);
        let parts=tiers.map(th=>{
          const active=n>=th;
          const desc=Object.keys(set.setBonus[th]).map(st2=>D.STAT_NAME[st2]+"+"+set.setBonus[th][st2]+(D.PERCENT_STATS.has(st2)?"%":"")).join(" ");
          return `<span class="${active?'set-on':'set-off'}">(${th}件)${desc}</span>`;
        }).join(" ");
        html+=`<div class="set-row"><b style="color:${rColor(set.rarity)}">${set.name}套 ${n}件</b> ${parts}</div>`;
      }
      html += `</div>`;
    }

    // 已穿装备
    html += `<div class="panel"><h3>装备</h3><div class="equip-slots">`;
    for(const slot in D.SLOTS){
      const e=st.equip[slot];
      if(e){
        html += `<div class="slot filled" style="border-color:${rColor(e.rarity)}">
          <div class="slot-label">${D.SLOTS[slot].icon}${D.SLOTS[slot].name}</div>
          <div class="slot-eq" style="color:${rColor(e.rarity)}">${e.name}</div>
          <div class="slot-stats">${statLine(e.stats)}</div>
          <button class="btn tiny" data-unequip="${slot}">卸下</button>
        </div>`;
      } else {
        html += `<div class="slot empty"><div class="slot-label">${D.SLOTS[slot].icon}${D.SLOTS[slot].name}</div><div class="slot-empty">空</div></div>`;
      }
    }
    html += `</div></div>`;
    screen().innerHTML=html;

    screen().querySelectorAll("[data-alloc]").forEach(b=>b.onclick=()=>{
      if(E.allocate(b.dataset.alloc)){ toast(D.PRIMARY[b.dataset.alloc].name+" +1","good"); renderHero(); refreshTop(); }
      else toast("没有可用属性点");
    });
    screen().querySelectorAll("[data-unequip]").forEach(b=>b.onclick=()=>{
      E.unequip(b.dataset.unequip); toast("已卸下"); renderHero(); refreshTop();
    });
    $("#reset-pts").onclick=()=>{
      if(E.resetPoints()){ toast("洗点成功，属性点已返还","good"); renderHero(); refreshTop(); }
      else toast("金币不足");
    };
    bindAdvance();
  }

  /* ---------- 转职面板 ---------- */
  function renderAdvanceSection(){
    const st=E.state;
    const def=E.advanceInfo();
    if(!def) return "";
    const pending=E.pendingAdvance();
    let html=`<div class="panel adv-panel"><h3>⚜️ 转职 ${pending?'<span class="badge">可转职!</span>':''}</h3>`;
    for(const tier of ["t1","t2"]){
      if(!def[tier]) continue;
      const chosen=st.advance[tier];
      const tierName = tier==="t1"?"一转":"二转";
      if(chosen){
        const o=def[tier].options.find(o=>o.id===chosen);
        html+=`<div class="adv-done">✔ ${tierName}：<b>${o.name}</b> — ${o.desc}</div>`;
      } else if(pending===tier){
        html+=`<div class="adv-choose"><div class="adv-title">${tierName}(Lv.${def[tier].level}) 二选一,永久生效:</div>`;
        for(const o of def[tier].options){
          html+=`<div class="adv-opt">
            <div class="adv-opt-name">${o.name}</div>
            <div class="adv-opt-desc">${o.desc}</div>
            <div class="adv-opt-bonus">加成:${Object.keys(o.bonus).map(k=>D.STAT_NAME[k]+"+"+o.bonus[k]+(D.PERCENT_STATS.has(k)?"%":"")).join(" ")}</div>
            <div class="adv-opt-skill">解锁技能:${o.skills.map(sk=>D.SKILLS[sk].name).join("、")}</div>
            <button class="btn small" data-adv-tier="${tier}" data-adv-opt="${o.id}">选择 ${o.name}</button>
          </div>`;
        }
        html+=`</div>`;
      } else {
        const lockReason = tier==="t2"&&!st.advance.t1 ? "需先完成一转" : `需达到 Lv.${def[tier].level}`;
        html+=`<div class="adv-lock">🔒 ${tierName}：${lockReason}</div>`;
      }
    }
    html+=`</div>`;
    return html;
  }
  function bindAdvance(){
    screen().querySelectorAll("[data-adv-opt]").forEach(b=>b.onclick=()=>{
      const o=E.doAdvance(b.dataset.advTier, b.dataset.advOpt);
      if(o){ toast(`转职成功:${o.name}!`,"good"); renderHero(); refreshTop(); }
      else toast("转职条件不满足");
    });
    screen().querySelectorAll("[data-title]").forEach(b=>b.onclick=()=>{
      E.setTitle(b.dataset.title==="none"?null:b.dataset.title); toast("已更换称号"); renderHero(); refreshTop();
    });
  }

  /* ---------- 称号面板 ---------- */
  function renderTitleSection(){
    const st=E.state;
    E.checkTitles();
    const owned=Object.keys(st.titles||{});
    let html=`<div class="panel"><h3>🏅 称号 <small>${owned.length}/${Object.keys(D.TITLES).length}</small></h3>`;
    html+=`<div class="title-grid">`;
    html+=`<button class="title-chip ${!st.activeTitle?'on':''}" data-title="none">无</button>`;
    for(const id in D.TITLES){
      const t=D.TITLES[id]; const has=st.titles[id]; const active=st.activeTitle===id;
      const bonus=Object.keys(t.bonus).map(k=>D.STAT_NAME[k]+"+"+t.bonus[k]+(D.PERCENT_STATS.has(k)?"%":"")).join(" ");
      html+=`<button class="title-chip ${active?'on':''} ${has?'':'locked'}" data-title="${id}" ${has?'':'disabled'} style="${has?'color:'+t.color:''}" title="${t.desc} | ${bonus}">${t.name}</button>`;
    }
    html+=`</div>`;
    if(st.activeTitle){ const t=D.TITLES[st.activeTitle]; html+=`<div class="title-bonus">加成:${Object.keys(t.bonus).map(k=>D.STAT_NAME[k]+"+"+t.bonus[k]+(D.PERCENT_STATS.has(k)?"%":"")).join(" ")}</div>`; }
    html+=`<p class="hint" style="margin:6px 0 0">点亮称号靠成就(击杀/通关/转职);灰色为未解锁。</p></div>`;
    return html;
  }

  /* ============================================================
   *  宠物
   * ============================================================ */
  function renderPet(){
    const st=E.state;
    let html=`<h2 class="title">🐾 宠物 / 坐骑</h2>`;
    // ---- 坐骑 ----
    html+=`<div class="panel"><h3>🐎 坐骑 <small>提供属性加成</small></h3>`;
    html+=`<div class="mount-list">`;
    html+=`<button class="title-chip ${!st.activeMount?'on':''}" data-mount="none">不骑乘</button>`;
    for(const id in D.MOUNTS){
      const m=D.MOUNTS[id]; const has=st.mounts[id]; const active=st.activeMount===id;
      if(has){
        html+=`<button class="title-chip ${active?'on':''}" data-mount="${id}" style="color:${rColor(m.rarity)}">${m.icon}${m.name}</button>`;
      }
    }
    html+=`</div>`;
    if(st.activeMount){ const m=D.MOUNTS[st.activeMount]; html+=`<div class="title-bonus">${m.icon}${m.name}:${Object.keys(m.bonus).map(k=>D.STAT_NAME[k]+"+"+m.bonus[k]+(D.PERCENT_STATS.has(k)?"%":"")).join(" ")}</div>`; }
    // 驯兽场:可购买坐骑
    html+=`<div class="shop-list" style="margin-top:8px">`;
    for(const id in D.MOUNTS){
      const m=D.MOUNTS[id]; if(!m.price||st.mounts[id]) continue;
      const cost = m.price.gold?`${m.price.gold}💰`:`${m.price.diamond}信用点`;
      const afford = m.price.gold?st.gold>=m.price.gold:st.diamond>=m.price.diamond;
      html+=`<div class="shop-row"><span class="shop-name">${m.icon} ${m.name}</span><span class="shop-desc">${m.desc}</span>
        <button class="btn tiny" data-buymount="${id}" ${afford?'':'disabled'}>买 ${cost}</button></div>`;
    }
    html+=`</div><p class="hint" style="margin:4px 0 0">稀有坐骑(福尔克纳战马/黄金地龙)由Boss掉落。</p></div>`;
    // ---- 宠物 ----
    html+=`<h3 class="sk-section">🐾 宠物 <small>${st.pets.length} 只</small></h3>`;
    html+=`<p class="hint">出战宠物提供被动属性加成,并在战斗中每回合协助攻击。击败Boss、孵蛋可获得宠物。</p>`;
    // 蛋商店
    html+=`<div class="panel"><h3>孵蛋屋</h3>
      <div class="item-row"><span>🥚 神秘宠物蛋</span>
      <span class="item-desc">随机孵化一只宠物(品质越高越稀有)</span>
      <button class="btn tiny" id="buy-egg" ${st.diamond<D.PET_EGG_PRICE?'disabled':''}>${D.PET_EGG_PRICE} 信用点</button></div></div>`;

    if(!st.pets.length){
      html+=`<p class="hint">还没有宠物。去打Boss或孵蛋吧!</p>`;
    } else {
      html+=`<div class="pet-list">`;
      for(const pet of st.pets){
        const sp=D.PETS[pet.species];
        const ps=E.petStats(pet);
        const active=st.activePet===pet.uid;
        const nextXp=E.petXpToNext(pet.level);
        html+=`<div class="pet-card ${active?'active':''}" style="border-color:${rColor(sp.rarity)}">
          <div class="pet-head"><span class="pet-icon">${sp.icon}</span>
            <span class="pet-name" style="color:${rColor(sp.rarity)}">${sp.name}</span>
            <span class="pet-lv">Lv.${pet.level}</span>
            ${active?'<span class="pet-active">出战中</span>':''}
          </div>
          <div class="pet-rarity">${D.RARITY[sp.rarity].name} · 技能「${sp.skill}」${sp.magical?'(魔法)':''}${sp.heal?' · 治疗':''}</div>
          <div class="pet-stats">${["atk","hp","def","spd"].map(k=>`<span class="stat">${D.STAT_NAME[k]} ${ps[k]}</span>`).join("")}</div>
          <div class="pet-xp"><small>经验 ${pet.exp}/${nextXp}（上限随主人等级）</small></div>
          <div class="pet-actions">
            ${active?`<button class="btn tiny" data-rest="">取消出战</button>`:`<button class="btn tiny" data-active="${pet.uid}">出战</button>`}
            <button class="btn tiny sell" data-release="${pet.uid}">放生(换信用点)</button>
          </div>
        </div>`;
      }
      html+=`</div>`;
    }
    screen().innerHTML=html;
    const be=$("#buy-egg"); if(be) be.onclick=()=>{
      const pet=E.buyPetEgg();
      if(pet){ const sp=D.PETS[pet.species]; toast(`孵出了 ${sp.name}!`,"good"); renderPet(); refreshTop(); }
      else toast("信用点不足");
    };
    screen().querySelectorAll("[data-active]").forEach(b=>b.onclick=()=>{ E.setActivePet(b.dataset.active); renderPet(); refreshTop(); });
    screen().querySelectorAll("[data-rest]").forEach(b=>b.onclick=()=>{ E.setActivePet(null); renderPet(); refreshTop(); });
    screen().querySelectorAll("[data-release]").forEach(b=>b.onclick=()=>{
      if(confirm("确定放生这只宠物?将返还少量信用点。")){ E.releasePet(b.dataset.release); toast("已放生"); renderPet(); refreshTop(); }
    });
    screen().querySelectorAll("[data-mount]").forEach(b=>b.onclick=()=>{ E.setMount(b.dataset.mount==="none"?null:b.dataset.mount); renderPet(); refreshTop(); });
    screen().querySelectorAll("[data-buymount]").forEach(b=>b.onclick=()=>{ if(E.buyMount(b.dataset.buymount)){ toast("购得坐骑!","good"); renderPet(); refreshTop(); } else toast("货币不足"); });
  }

  /* ============================================================
   *  背包
   * ============================================================ */
  let bagFilter="all", bagSort="power";
  function renderBag(){
    const st=E.state;
    let html=`<h2 class="title">🎒 背包 <small>${st.bag.length}/200</small></h2>`;
    // 消耗品
    const cons=Object.keys(st.items).filter(id=>st.items[id]>0);
    if(cons.length){
      html+=`<div class="panel"><h3>道具</h3><div class="item-list">`;
      for(const id of cons){
        const it=D.CONSUMABLES[id];
        const usable = it.heal||it.mana;
        html+=`<div class="item-row"><span>${it.icon} ${it.name} <small>x${st.items[id]}</small></span>
          <span class="item-desc">${it.desc}</span>
          ${usable?`<button class="btn tiny" data-use="${id}">使用</button>`:''}</div>`;
      }
      html+=`</div></div>`;
    }
    // 材料
    const mats=Object.keys(st.materials||{}).filter(id=>st.materials[id]>0);
    if(mats.length){
      html+=`<div class="panel"><h3>材料</h3><div class="mat-list">`;
      for(const id of mats){
        const m=D.MATERIALS[id]; if(!m) continue;
        html+=`<span class="mat-chip" title="${m.name}">${m.icon} ${m.name}<b>×${st.materials[id]}</b></span>`;
      }
      html+=`</div></div>`;
    }
    // 宝石
    const gems=Object.keys(st.gems||{}).filter(k=>st.gems[k]>0);
    if(gems.length){
      html+=`<div class="panel"><h3>宝石 <small>镶嵌入装备凹槽</small></h3><div class="mat-list">`;
      for(const gk of gems){
        const [key,grade]=gk.split("_"); const gd=D.GEMS[key]; if(!gd) continue;
        html+=`<span class="mat-chip">${gd.icon} ${D.GEM_GRADES[+grade]}${gd.name}<b>×${st.gems[gk]}</b></span>`;
      }
      html+=`</div></div>`;
    }
    // 潘多拉之盒
    html+=`<div class="panel"><h3>📦 潘多拉之盒 <small>3件同品质→10%升一阶</small></h3>
      <button class="btn small" id="open-pandora">打开潘多拉之盒</button></div>`;
    // 装备筛选排序
    html+=`<div class="bag-controls">
      <select id="bag-filter">
        <option value="all">全部部位</option>
        ${Object.keys(D.SLOTS).map(s=>`<option value="${s}" ${bagFilter===s?'selected':''}>${D.SLOTS[s].name}</option>`).join("")}
      </select>
      <select id="bag-sort">
        <option value="power" ${bagSort==='power'?'selected':''}>按战力</option>
        <option value="rarity" ${bagSort==='rarity'?'selected':''}>按品质</option>
        <option value="level" ${bagSort==='level'?'selected':''}>按等级</option>
      </select>
      <button class="btn small" id="sell-junk">一键卖白装/青铜</button>
    </div>`;

    let list = st.bag.slice();
    if(bagFilter!=="all") list=list.filter(e=>e.slot===bagFilter);
    if(bagSort==="power") list.sort((a,b)=>b.power-a.power);
    else if(bagSort==="rarity") list.sort((a,b)=>D.RARITY_ORDER.indexOf(b.rarity)-D.RARITY_ORDER.indexOf(a.rarity));
    else list.sort((a,b)=>b.level-a.level);

    html+=`<div class="bag-list">`;
    if(!list.length) html+=`<p class="hint">空空如也，去刷怪掉装备吧。</p>`;
    for(const e of list){
      const equipped = st.equip[e.slot];
      const cmp = equipped? compareTag(e, equipped):"";
      const wearable = E.canEquip(e);
      html+=equipCard(e, `<div class="eq-actions">
        ${wearable?`<button class="btn tiny" data-equip="${e.id}">装备</button>`:`<button class="btn tiny" disabled>职业不符</button>`}
        <button class="btn tiny" data-forge="${e.id}">强化/镶嵌</button>
        <button class="btn tiny sell" data-sell="${e.id}">卖出</button>
        ${cmp}
      </div>`);
    }
    html+=`</div>`;
    screen().innerHTML=html;

    $("#bag-filter").onchange=e=>{bagFilter=e.target.value;renderBag();};
    $("#bag-sort").onchange=e=>{bagSort=e.target.value;renderBag();};
    $("#sell-junk").onclick=()=>{
      let total=0,n=0;
      for(const e of st.bag.slice()){
        if((e.rarity==="white"||e.rarity==="bronze") && !e.setName){ total+=E.sellEquip(e.id); n++; }
      }
      toast(`卖出 ${n} 件，获得 ${total} 金币`, n?"good":"info"); renderBag(); refreshTop();
    };
    screen().querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>{
      const r=E.equipItem(b.dataset.equip);
      if(r==="restricted"){ toast("职业不符,无法装备","bad"); return; }
      toast("已装备","good"); renderBag(); refreshTop();
    });
    screen().querySelectorAll("[data-sell]").forEach(b=>b.onclick=()=>{
      const g=E.sellEquip(b.dataset.sell); toast(`卖出获得 ${g} 金币`,"good"); renderBag(); refreshTop();
    });
    screen().querySelectorAll("[data-use]").forEach(b=>b.onclick=()=>{
      E.useConsumable(b.dataset.use); toast("已使用","good"); renderBag(); refreshTop();
    });
    screen().querySelectorAll("[data-forge]").forEach(b=>b.onclick=()=> showForge(b.dataset.forge));
    const op=$("#open-pandora"); if(op) op.onclick=()=> showPandora();
  }

  /* ---------- 强化/镶嵌 弹窗 ---------- */
  function showForge(id){
    const st=E.state; const e=E.findEquipById(id); if(!e) return;
    const cur=e.plus||0; const max=D.ENHANCE_MAX;
    const row = cur<max ? D.ENHANCE[cur] : null;
    const lg = st.materials.lucky_gem||0;
    let html=`<div class="enc-icon">⚒️</div><h3 class="enc-title" style="color:${rColor(e.rarity)}">${e.name} +${cur}</h3>`;
    html+=`<div class="eq-stats" style="justify-content:center">${statLine(e.stats)}${gemLine(e)}</div>`;
    html+=`<p class="enc-text">强化作用属性：${D.STAT_NAME[E.enhanceStatOf(e)]}（当前 +${e.enhanceBonus||0}）</p>`;
    if(row){
      const failTxt = row.fail==='break'?'失败可能<b style="color:#e3434f">碎裂</b>':row.fail==='down'?'失败降1级':'失败不降级';
      html+=`<p class="enc-text">下一级 +${cur+1}：成功率 ${Math.round(row.rate*100)}%，${failTxt}<br>消耗 1 幸运宝石（持有 ${lg}）</p>`;
      html+=`<div class="enc-actions"><button class="btn" id="do-enh" ${lg<=0?'disabled':''}>强化 +${cur+1}</button>`;
    } else {
      html+=`<p class="enc-text">已达强化上限 +${max}</p><div class="enc-actions">`;
    }
    // 凹槽镶嵌
    if(e.sockets){
      html+=`<div class="forge-sockets"><b>凹槽 ${(e.gems||[]).length}/${e.sockets}</b>`;
      if((e.gems||[]).length<e.sockets){
        const gemKeys=Object.keys(st.gems||{}).filter(k=>st.gems[k]>0);
        if(gemKeys.length){
          html+=`<select id="gem-sel">${gemKeys.map(gk=>{const[k,g]=gk.split("_");return `<option value="${gk}">${D.GEM_GRADES[+g]}${D.GEMS[k].name}(+${D.GEMS[k].vals[+g]}${D.STAT_NAME[D.GEMS[k].stat]}) ×${st.gems[gk]}</option>`;}).join("")}</select>
            <button class="btn small" id="do-socket">镶嵌</button>`;
        } else { html+=`<div class="q-tip">没有宝石可镶嵌</div>`; }
      }
      html+=`</div>`;
    }
    html+=`<button class="btn" id="forge-close">关闭</button></div>`;
    const wrap=showModal(html);
    const de=$("#do-enh"); if(de) de.onclick=()=>{ const r=E.enhanceEquip(id); toast(r.msg, r.ok?"good":(r.broken?"bad":"info")); if(r.broken){closeModal();renderBag();refreshTop();} else {showForge(id);refreshTop();} };
    const ds=$("#do-socket"); if(ds) ds.onclick=()=>{ const v=$("#gem-sel").value; const[k,g]=v.split("_"); const r=E.socketGem(id,k,+g); toast(r.msg,r.ok?"good":"info"); showForge(id); refreshTop(); };
    $("#forge-close").onclick=()=>{ closeModal(); renderBag(); refreshTop(); };
  }

  /* ---------- 潘多拉之盒 弹窗 ---------- */
  let pandoraSel=[];
  function showPandora(){
    pandoraSel=[];
    const st=E.state;
    const list=st.bag.filter(e=>!e.setName);
    let html=`<div class="enc-icon">📦</div><h3 class="enc-title">潘多拉之盒</h3>
      <p class="enc-text">选择 3 件<b>同品质</b>装备投入,10% 概率合成出高一阶装备,否则全部消失。</p>
      <div class="pandora-list">`;
    for(const e of list){
      html+=`<label class="pandora-item"><input type="checkbox" data-pk="${e.id}" data-r="${e.rarity}"> <span style="color:${rColor(e.rarity)}">${D.RARITY[e.rarity].name} ${e.name}${e.plus?'+'+e.plus:''}</span></label>`;
    }
    html+=`</div><div class="enc-actions"><button class="btn" id="do-pandora" disabled>投入合成</button><button class="btn" id="pandora-close">关闭</button></div>`;
    const wrap=showModal(html);
    wrap.querySelectorAll("[data-pk]").forEach(cb=>cb.onchange=()=>{
      pandoraSel=[...wrap.querySelectorAll("[data-pk]:checked")].map(x=>x.dataset.pk);
      $("#do-pandora").disabled = pandoraSel.length!==3;
    });
    $("#do-pandora").onclick=()=>{ const r=E.pandoraCombine(pandoraSel); toast(r.msg, r.success?"good":(r.ok?"info":"bad")); closeModal(); renderBag(); refreshTop(); };
    $("#pandora-close").onclick=()=> closeModal();
  }

  function compareTag(newE, oldE){
    const diff=newE.power-oldE.power;
    if(diff>0) return `<span class="cmp up">↑战力+${diff}</span>`;
    if(diff<0) return `<span class="cmp down">↓战力${diff}</span>`;
    return `<span class="cmp eq">≈持平</span>`;
  }

  /* ============================================================
   *  技能
   * ============================================================ */
  function renderSkill(){
    const st=E.state; const cls=D.CLASSES[st.classId];
    let html=`<h2 class="title">📖 ${cls.name}技能</h2>`;
    // 主动技能(含转职解锁)
    html+=`<h3 class="sk-section">主动技能</h3>`;
    html+=`<p class="hint">初始技能自带,其余需学习技能书(打怪掉落 / 商店「技能导师」购买);转职技能由转职解锁。</p>`;
    for(const sk of E.classSkillList()){
      const d=D.SKILLS[sk];
      const learned=st.learned[sk];
      const adv = d.unlock>=999;
      const hasBook = st.books[sk]>0;
      const levelOk = st.level>=d.unlock;
      let statusTag, action="";
      if(learned){ statusTag='<span class="sk-ok">已学</span>'; }
      else if(adv){ statusTag='<span class="sk-lock">转职解锁</span>'; }
      else if(hasBook){
        statusTag=`<span class="sk-book">📘有书</span>`;
        action = levelOk ? `<button class="btn tiny" data-learn="${sk}">学习</button>` : `<span class="sk-lock">需Lv.${d.unlock}</span>`;
      } else {
        statusTag=`<span class="sk-lock">需技能书·Lv.${d.unlock}</span>`;
      }
      html+=`<div class="skill-card ${learned?'':'locked'}">
        <div class="sk-head"><span class="sk-name">${d.name}</span>
          <span class="sk-tag ${d.type}">${typeLabel(d.type)}</span>
          ${statusTag}
        </div>
        <div class="sk-meta">${d.mp?`法力${d.mp} `:''}${d.cd?`冷却${d.cd}回合 `:''}${d.aoe?'群体 ':''}${d.hits?d.hits+'连击 ':''}${d.power?`倍率${Math.round(d.power*100)}%`:''}</div>
        <div class="sk-desc">${d.desc}</div>
        ${action}
      </div>`;
    }
    // 被动技能
    html+=`<h3 class="sk-section">被动技能(专长)</h3>`;
    html+=`<p class="hint">达到等级自动领悟,常驻生效。</p>`;
    for(const pid of (D.CLASS_PASSIVES[st.classId]||[])){
      const p=D.PASSIVES[pid]; const learned=st.level>=p.unlock;
      html+=`<div class="skill-card ${learned?'':'locked'}">
        <div class="sk-head"><span class="sk-name">🔹${p.name}</span>
          <span class="sk-tag buff">被动</span>
          ${learned?'<span class="sk-ok">已领悟</span>':`<span class="sk-lock">Lv.${p.unlock}领悟</span>`}
        </div>
        <div class="sk-desc">${p.desc}</div>
      </div>`;
    }
    screen().innerHTML=html;
    screen().querySelectorAll("[data-learn]").forEach(b=>b.onclick=()=>{
      const r=E.learnSkillBook(b.dataset.learn);
      if(r===true){ toast("学会了新技能!","good"); renderSkill(); refreshTop(); }
      else toast(r==="level"?"等级不足":r==="nobook"?"没有技能书":"无法学习");
    });
  }
  function typeLabel(t){return {physical:"物理",magical:"魔法",heal:"治疗",buff:"增益"}[t]||t;}

  /* ============================================================
   *  城镇(NPC hub:声望/药剂师/技能导师/拍卖行)
   * ============================================================ */
  function renderTown(){
    const st=E.state;
    const tier=E.repTier(), nextT=E.repNext(), disc=E.repDiscount();
    let html=`<h2 class="title">🏙️ 卡罗尔城 <small>金币 ${st.gold} · 信用点 ${st.diamond}</small></h2>`;

    // 声望大厅
    html+=`<div class="panel"><h3>🏛️ 声望大厅 · 执政官特鲁斯</h3>`;
    html+=`<div class="rep-row">尊敬值 <b>${st.rep}</b> · 地位 <b style="color:var(--accent2)">${tier.name}</b> · 全城购物折扣 <b>${Math.round(disc*100)}%</b></div>`;
    if(nextT){ const pct=Math.min(100,(st.rep-tier.min)/(nextT.min-tier.min)*100); html+=`<div class="qbar"><div class="qbar-fill" style="width:${pct}%"></div><span>${st.rep}/${nextT.min} → ${nextT.name}</span></div>`; }
    html+=`<p class="hint" style="margin:4px 0 0">完成主线/职业/支线任务、击败Boss提升尊敬值;地位越高商店越便宜。</p></div>`;

    // 药剂师(消耗品,折扣价)
    html+=`<div class="panel"><h3>⚗️ 药剂师·星空 <small>消耗品${disc>0?` · 已${Math.round(disc*100)}%折扣`:''}</small></h3><div class="shop-list">`;
    for(const id of D.SHOP_ITEMS){
      const it=D.CONSUMABLES[id]; const price=E.discountPrice(it.price);
      html+=`<div class="shop-row">
        <span class="shop-name">${it.icon} ${it.name}</span>
        <span class="shop-desc">${it.desc}</span>
        <span class="shop-have">持有 ${st.items[id]||0}</span>
        <button class="btn tiny" data-buy="${id}" ${st.gold<price?'disabled':''}>买 ${price}💰</button>
      </div>`;
    }
    html+=`</div></div>`;

    // 技能导师
    html+=`<div class="panel"><h3>📖 技能导师·费瑟斯顿 <small>技能书</small></h3><div class="shop-list">`;
    for(const sk of E.bookSkills()){
      const d=D.SKILLS[sk]; const price=E.discountPrice(E.skillBookPrice(sk));
      const owned=st.learned[sk]; const hasBook=st.books[sk]>0;
      html+=`<div class="shop-row">
        <span class="shop-name">📘 ${d.name}</span>
        <span class="shop-desc">Lv.${d.unlock}可学</span>
        <span class="shop-have">${owned?'已学':hasBook?'有书':''}</span>
        ${owned?'<button class="btn tiny" disabled>已学会</button>'
          :`<button class="btn tiny" data-buybook="${sk}" ${st.gold<price?'disabled':''}>买 ${price}💰</button>`}
      </div>`;
    }
    html+=`</div><p class="hint">买书后到「技能」页学习。</p></div>`;

    // 拍卖行:出售材料/宝石换金币
    html+=`<div class="panel"><h3>⚖️ 拍卖行 <small>出售材料换金币</small></h3><div class="shop-list">`;
    const mats=Object.keys(st.materials||{}).filter(id=>st.materials[id]>0 && D.MATERIALS[id]);
    if(!mats.length) html+=`<p class="hint">暂无可出售材料。</p>`;
    for(const id of mats){
      const m=D.MATERIALS[id];
      html+=`<div class="shop-row"><span class="shop-name">${m.icon} ${m.name}</span>
        <span class="shop-have">×${st.materials[id]}</span>
        <button class="btn tiny" data-sellmat="${id}">全卖 ${m.sell*st.materials[id]}💰</button></div>`;
    }
    html+=`</div></div>`;

    // 炼药(生活技能)
    html+=`<div class="panel"><h3>⚗️ 炼药 <small>${E.lifeTierName("alchemy")} 熟练度${st.life.alchemy}</small></h3><div class="shop-list">`;
    for(const r of D.ALCHEMY_RECIPES){
      const ok=E.lifeTierIdx("alchemy")>=r.lv;
      const matTxt=Object.keys(r.mats).map(id=>`${D.MATERIALS[id].name}×${r.mats[id]}`).join("+");
      html+=`<div class="shop-row"><span class="shop-name">${D.CONSUMABLES[r.out].icon} ${r.name}</span>
        <span class="shop-desc">需 ${matTxt}</span>
        <button class="btn tiny" data-alchemy="${r.id}" ${ok?'':'disabled'}>${ok?'炼制':'需'+D.LIFE_TIERS[r.lv].name}</button></div>`;
    }
    html+=`</div></div>`;
    // 锻造
    html+=`<div class="panel"><h3>⚒️ 铁匠·卡迪 · 锻造 <small>${E.lifeTierName("smith")} 熟练度${st.life.smith}</small></h3><div class="shop-list">`;
    for(const r of D.SMITH_RECIPES){
      const ok=E.lifeTierIdx("smith")>=r.lv;
      const matTxt=Object.keys(r.mats).map(id=>`${D.MATERIALS[id].name}×${r.mats[id]}`).join("+");
      html+=`<div class="shop-row"><span class="shop-name" style="color:${rColor(r.tier)}">${r.name}</span>
        <span class="shop-desc">需 ${matTxt}</span>
        <button class="btn tiny" data-smith="${r.id}" ${ok?'':'disabled'}>${ok?'锻造':'需'+D.LIFE_TIERS[r.lv].name}</button></div>`;
    }
    html+=`</div><p class="hint">采集(地图页)→ 炼药/锻造,熟练度越高成功率越高、可造更高级。装备强化/镶嵌在背包。</p></div>`;
    // 其他NPC指引
    html+=`<div class="panel"><h3>🧭 其他NPC</h3>
      <div class="hint">🐎 驯兽场 — 购买坐骑在「宠物」页　⚜️ 转职导师 — 转职在「角色」页</div></div>`;

    screen().innerHTML=html;
    screen().querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{
      if(E.buyItem(b.dataset.buy)){ toast("购买成功","good"); renderTown(); refreshTop(); } else toast("金币不足");
    });
    screen().querySelectorAll("[data-buybook]").forEach(b=>b.onclick=()=>{
      if(E.buySkillBook(b.dataset.buybook)){ toast("购得技能书,去技能页学习","good"); renderTown(); refreshTop(); } else toast("金币不足");
    });
    screen().querySelectorAll("[data-sellmat]").forEach(b=>b.onclick=()=>{
      const id=b.dataset.sellmat; const m=D.MATERIALS[id]; const n=st.materials[id]||0;
      if(n>0){ st.gold+=m.sell*n; delete st.materials[id]; E.save(); toast(`卖出 ${m.name}×${n}`,"good"); renderTown(); refreshTop(); }
    });
    screen().querySelectorAll("[data-alchemy]").forEach(b=>b.onclick=()=>{
      const r=E.craftAlchemy(b.dataset.alchemy);
      if(r.err){ toast(r.err); return; }
      toast(r.ok?`炼制成功:${D.CONSUMABLES[r.out].name}×${r.n}`:r.msg, r.ok?"good":"bad"); renderTown(); refreshTop();
    });
    screen().querySelectorAll("[data-smith]").forEach(b=>b.onclick=()=>{
      const r=E.craftSmith(b.dataset.smith);
      if(r.err){ toast(r.err); return; }
      toast(r.ok?`锻造成功:${r.item.name}(背包)`:r.msg, r.ok?"good":"bad"); renderTown(); refreshTop();
    });
  }

  /* ============================================================
   *  系统
   * ============================================================ */
  function renderSys(){
    const st=E.state;
    let html=`<h2 class="title">⚙️ 系统</h2>`;
    html+=`<div class="panel"><h3>角色统计</h3><div class="stat-grid">
      <div class="stat-row"><span>击杀怪物</span><b>${st.stats_total.kills}</b></div>
      <div class="stat-row"><span>击杀Boss</span><b>${st.stats_total.bossKills}</b></div>
      <div class="stat-row"><span>死亡次数</span><b>${st.stats_total.deaths}</b></div>
      <div class="stat-row"><span>装备掉落</span><b>${st.stats_total.drops}</b></div>
      <div class="stat-row"><span>当前金币</span><b>${st.gold}</b></div>
      <div class="stat-row"><span>背包装备</span><b>${st.bag.length}</b></div>
    </div></div>`;
    html+=`<div class="panel"><h3>存档</h3>
      <p class="hint">游戏自动保存到本地浏览器。可导出存档字符串备份/迁移。</p>
      <button class="btn small" id="export-save">导出存档</button>
      <button class="btn small" id="import-save">导入存档</button>
      <textarea id="save-box" placeholder="存档字符串将显示在此；粘贴后点导入"></textarea>
    </div>`;
    html+=`<div class="panel danger"><h3>危险操作</h3>
      <button class="btn small danger" id="wipe">🗑️ 删除存档并重开</button>
    </div>`;
    screen().innerHTML=html;
    $("#export-save").onclick=()=>{ $("#save-box").value=E.exportSave(); toast("已导出，复制保存","good"); };
    $("#import-save").onclick=()=>{
      const v=$("#save-box").value.trim(); if(!v){toast("请粘贴存档");return;}
      if(E.importSave(v)){ toast("导入成功","good"); refreshTop(); go("hero"); } else toast("存档无效","bad");
    };
    $("#wipe").onclick=()=>{
      if(confirm("确定删除存档并重新开始？此操作不可恢复！")){ E.wipe(); location.reload(); }
    };
  }

  /* ============================================================
   *  创建角色 / 开始界面
   * ============================================================ */
  function renderStart(){
    $("#topbar").classList.add("hidden");
    $("#navbar").classList.add("hidden");
    let html=`<div class="start">
      <h1 class="game-title">${D.TITLE}</h1>
      <p class="subtitle">${D.SUBTITLE}</p>
      <p class="lore">${D.LORE}</p>`;
    if(E.hasSave()){
      html+=`<button class="btn big" id="continue">▶ 继续游戏</button>`;
    }
    html+=`<button class="btn big" id="new-game">✦ 创建新角色</button></div>`;
    screen().innerHTML=html;
    const c=$("#continue"); if(c) c.onclick=()=>{ if(E.load()){ Main.boot(); } };
    $("#new-game").onclick=()=> renderCreate();
  }

  let pickClass=null;
  function renderCreate(){
    let html=`<div class="create"><h2 class="title">创建角色</h2>`;
    html+=`<input id="hero-name-input" class="name-input" maxlength="10" placeholder="输入角色名（最多10字）" />`;
    html+=`<div class="class-grid">`;
    for(const id in D.CLASSES){
      const c=D.CLASSES[id];
      html+=`<div class="class-card" data-cls="${id}">
        <div class="class-icon">${c.icon}</div>
        <div class="class-name">${c.name}</div>
        <div class="class-role">${c.role}</div>
        <div class="class-desc">${c.desc}</div>
        <div class="class-stats">
          <span>❤️${c.base.hp}</span><span>⚔️${c.base.atk}</span><span>🔮${c.base.mat}</span><span>🛡️${c.base.def}</span><span>⚡${c.base.spd}</span>
        </div>
      </div>`;
    }
    html+=`</div>`;
    html+=`<button class="btn big" id="confirm-create" disabled>开始冒险</button>
      <button class="btn small" id="back-start">返回</button></div>`;
    screen().innerHTML=html;

    screen().querySelectorAll(".class-card").forEach(card=>{
      card.onclick=()=>{
        screen().querySelectorAll(".class-card").forEach(c=>c.classList.remove("sel"));
        card.classList.add("sel"); pickClass=card.dataset.cls;
        $("#confirm-create").disabled=false;
      };
    });
    $("#confirm-create").onclick=()=>{
      const name=$("#hero-name-input").value.trim()||"无名英雄";
      if(!pickClass){toast("请选择职业");return;}
      E.newGame(name, pickClass);
      Main.boot();
      toast("欢迎来到幻境，"+name+"！","good");
    };
    $("#back-start").onclick=()=> renderStart();
  }

  /* ============================================================
   *  随机奇遇弹窗
   * ============================================================ */
  function closeModal(){ const m=$("#modal-wrap"); if(m) m.remove(); }
  function showModal(inner){
    closeModal();
    const wrap=document.createElement("div");
    wrap.id="modal-wrap"; wrap.className="modal-wrap";
    wrap.innerHTML=`<div class="modal">${inner}</div>`;
    document.body.appendChild(wrap);
    return wrap;
  }
  function showEncounter(ev, mapId){
    let html=`<div class="enc-icon">${ev.icon}</div>
      <h3 class="enc-title">${ev.title}</h3>
      <p class="enc-text">${ev.text}</p>
      <div class="enc-actions">`;
    for(const a of ev.actions){
      html+=`<button class="btn" data-enc-act="${a.id}">${a.label}</button>`;
    }
    html+=`</div>`;
    const wrap=showModal(html);
    wrap.querySelectorAll("[data-enc-act]").forEach(b=>b.onclick=()=>{
      closeModal();
      Main.resolveEncounter(b.dataset.encAct, mapId);
    });
  }
  function showEncounterResult(res, mapId){
    let html=`<div class="enc-icon">✨</div><p class="enc-text">${res.msg}</p>`;
    if(res.drops&&res.drops.length){
      html+=`<div class="drops">`;
      for(const e of res.drops) html+=equipCard(e, `<button class="btn small" data-equip="${e.id}">装备</button>`);
      html+=`</div>`;
    }
    html+=`<div class="enc-actions"><button class="btn" id="enc-ok">确定</button></div>`;
    const wrap=showModal(html);
    wrap.querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>{
      if(E.equipItem(b.dataset.equip)){ toast("已装备","good"); b.disabled=true; b.textContent="已装备"; refreshTop(); }
    });
    $("#enc-ok").onclick=()=>{ closeModal(); refreshTop(); go("map"); };
  }

  /* ---------- 导出 ---------- */
  return { toast, refreshTop, go, renderBattle, renderStart, renderCreate,
           showEncounter, showEncounterResult,
           get current(){return current;} };
})();
