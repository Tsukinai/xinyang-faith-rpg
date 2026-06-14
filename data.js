/* ============================================================
 *  《信仰》Faith — 游戏数据层
 *  取材自小说《重生之贼行天下》(作者:发飙的蜗牛)
 *  世界观:亚特兰大陆 / 三大阵营 / 秩序之章 / 盗贼为核心
 * ============================================================ */

const GameData = {};

GameData.TITLE = "信仰";
GameData.SUBTITLE = "Faith · 亚特兰大陆";
GameData.LORE =
  "亚特兰大陆,光明与黑暗永恒交战。传说集齐失落的『秩序之章』可重建神之秩序,成为光明神殿的教皇;" +
  "集齐『混乱之章』则化身黑暗之王。你,一名带着前世记忆重生的盗贼,将在天空之城卡罗尔城重新启程——" +
  "追逐阴影的脚步,这是盗贼的赞歌。";

/* ---------- 二级属性 ---------- */
GameData.STAT_KEYS = ["hp","mp","atk","mat","def","mdf","spd","crit","critDmg","dodge","acc","lifesteal","hpregen"];
GameData.STAT_NAME = {
  hp:"生命", mp:"法力", atk:"物攻", mat:"魔攻", def:"物防", mdf:"魔防",
  spd:"速度", crit:"暴击率", critDmg:"暴伤", dodge:"闪避率", acc:"命中率",
  lifesteal:"吸血", hpregen:"回血"
};
GameData.PERCENT_STATS = new Set(["crit","critDmg","dodge","acc","lifesteal"]);

/* ---------- 主属性(DND式:力/敏/智/体) ---------- */
GameData.PRIMARY = {
  str: { name:"力量", desc:"+物攻 +少量物防" },
  agi: { name:"敏捷", desc:"+速度 +暴击 +闪避(盗贼核心)" },
  int: { name:"智力", desc:"+魔攻 +法力 +魔防" },
  vit: { name:"体质", desc:"+生命 +物防 +回血" },
};
GameData.PRIMARY_TO_STAT = {
  str: { atk:2.0, def:0.5 },
  agi: { spd:0.8, crit:0.4, dodge:0.3 },
  int: { mat:2.0, mp:5, mdf:0.6 },
  vit: { hp:12, def:0.6, hpregen:0.4 },
};

/* ---------- 阵营 ---------- */
GameData.FACTIONS = {
  green:  { name:"格林兰帝国", camp:"光明", desc:"长老议会制的人类国度,天空之城卡罗尔城所在。" },
  saturn: { name:"萨特恩帝国", camp:"光明", desc:"矮人、兽人、精灵组成的部落联盟。" },
  demon:  { name:"魔裔部落",   camp:"黑暗", desc:"独裁制的黑暗势力。" },
  giant:  { name:"巨人部落",   camp:"中立", desc:"爱好和平的中立者。" },
};

/* ============================================================
 *  职业(取材原著五大基础职业)
 * ============================================================ */
GameData.CLASSES = {
  rogue: {
    name:"盗贼", icon:"🗡️", role:"敏捷物理 / 暴击潜行 / 偷窃",
    desc:"原著主角职业。极高速度、暴击与闪避,可在战斗中偷取金币,转职链:疾风盗贼→大盗贼→影舞者。",
    base:{ hp:160, mp:70, atk:23, mat:6, def:10, mdf:9, spd:17, crit:15, critDmg:185, dodge:12, acc:98, lifesteal:4, hpregen:1 },
    primary:{ str:4, agi:7, int:1, vit:2 },
    startStats:{ str:6, agi:10, int:2, vit:3 },
    skills:["vital_strike","stun_blow","steal","shadow_step","crippling_poison"],
    perk:{ gold:0.30, drop:0.12 }, // 盗贼天赋:多金币、多掉落
    advTree:"rogue",
  },
  warrior: {
    name:"战士", icon:"⚔️", role:"近战物理 / 高生存",
    desc:"高生命高物防的前排,怒气爆发与吸血站场。转职链:盾甲战士/狂剑士→神武士/大剑士。",
    base:{ hp:220, mp:40, atk:24, mat:4, def:18, mdf:8, spd:9, crit:5, critDmg:150, dodge:3, acc:95, lifesteal:0, hpregen:2 },
    primary:{ str:6, agi:2, int:1, vit:5 },
    startStats:{ str:8, agi:4, int:2, vit:8 },
    skills:["heavy_slash","shield_bash","battlecry","whirlwind","execute"],
    advTree:"warrior",
  },
  mage: {
    name:"法师", icon:"🔮", role:"远程魔法 / 高爆发",
    desc:"脆皮高魔攻,元素法术与奥术穿透。原著分元素/奥术/圣言三系,转职链:元素法师/奥术法师→魔导师/大法师。",
    base:{ hp:130, mp:160, atk:8, mat:28, def:7, mdf:16, spd:11, crit:6, critDmg:160, dodge:5, acc:97, lifesteal:0, hpregen:1 },
    primary:{ str:1, agi:2, int:7, vit:2 },
    startStats:{ str:2, agi:4, int:10, vit:4 },
    skills:["fireball","frost_nova","arcane_missile","mana_shield","arcane_blast"],
    advTree:"mage",
  },
  priest: {
    name:"牧师", icon:"✨", role:"治疗辅助 / 神圣输出",
    desc:"圣言牧师,自我治疗与神圣伤害,越打越稳。转职链:圣言牧师/暗牧→神牧。",
    base:{ hp:170, mp:140, atk:10, mat:22, def:11, mdf:18, spd:10, crit:5, critDmg:150, dodge:4, acc:96, lifesteal:0, hpregen:4 },
    primary:{ str:2, agi:2, int:6, vit:3 },
    startStats:{ str:3, agi:4, int:8, vit:5 },
    skills:["smite","heal","holy_nova","renew","judgement"],
    advTree:"priest",
  },
  paladin: {
    name:"圣骑士", icon:"🛡️", role:"圣盾近战 / 神术治疗",
    desc:"神殿守护者,近战+神术+治疗+光环,极高生存。转职链:守护骑士/禁言圣骑士→圣剑士。",
    base:{ hp:210, mp:110, atk:20, mat:16, def:17, mdf:16, spd:9, crit:5, critDmg:150, dodge:3, acc:96, lifesteal:0, hpregen:3 },
    primary:{ str:5, agi:2, int:3, vit:5 },
    startStats:{ str:7, agi:3, int:5, vit:7 },
    skills:["holy_strike","shield_of_faith","consecration","lay_on_hands","divine_storm"],
    advTree:"paladin",
  },
};

/* ============================================================
 *  技能
 * ============================================================ */
GameData.SKILLS = {
  /* 盗贼 */
  vital_strike:    { name:"要害攻击", type:"physical", scale:"atk", power:1.6, mp:0,  cd:0, unlock:1,  critUp:0.15, desc:"160%物攻,暴击率+15%。" },
  stun_blow:       { name:"击晕",     type:"physical", scale:"atk", power:1.1, mp:16, cd:3, unlock:6,  stun:1, desc:"110%物攻并击晕目标1回合。" },
  steal:           { name:"盗窃术",   type:"physical", scale:"atk", power:1.2, mp:14, cd:2, unlock:10, steal:0.6, desc:"120%物攻,并偷取目标身上大量金币。" },
  shadow_step:     { name:"阴影舞步", type:"buff", mp:18, cd:3, unlock:16, buff:{dodge:0.3,spd:0.4,crit:0.15,turns:2}, desc:"2回合内闪避+30%、速度+40%、暴击+15%。" },
  crippling_poison:{ name:"淬毒匕首", type:"physical", scale:"atk", power:1.3, mp:18, cd:2, unlock:24, dot:{pct:0.35,turns:3}, lifesteal:0.3, desc:"130%物攻、剧毒3回合并吸血。" },
  /* 战士 */
  heavy_slash: { name:"重斩",   type:"physical", scale:"atk", power:1.4, mp:0,  cd:0, unlock:1,  desc:"140%物攻,无消耗。" },
  shield_bash: { name:"盾击",   type:"physical", scale:"atk", power:1.0, mp:16, cd:3, unlock:6,  stun:1, desc:"100%物攻并击晕目标1回合。" },
  battlecry:   { name:"战吼",   type:"buff", mp:20, cd:4, unlock:10, buff:{atk:0.3,def:0.2,turns:3}, desc:"3回合内物攻+30%、物防+20%。" },
  whirlwind:   { name:"旋风斩", type:"physical", scale:"atk", power:1.1, mp:22, cd:2, unlock:16, aoe:true, desc:"群体110%物攻旋转打击。" },
  execute:     { name:"斩杀",   type:"physical", scale:"atk", power:2.2, mp:30, cd:3, unlock:24, exec:0.3, desc:"220%物攻;目标低于30%生命时伤害翻倍。" },
  /* 法师 */
  fireball:      { name:"奥义火球", type:"magical", scale:"mat", power:1.5, mp:14, cd:0, unlock:1,  desc:"150%魔攻火焰伤害。" },
  frost_nova:    { name:"冰霜新星", type:"magical", scale:"mat", power:1.2, mp:22, cd:2, unlock:6,  aoe:true, slow:true, desc:"群体120%魔攻并减速。" },
  arcane_missile:{ name:"奥术飞弹", type:"magical", scale:"mat", power:0.65,mp:18, cd:1, unlock:10, hits:3, desc:"射出3发飞弹,每发65%魔攻。" },
  mana_shield:   { name:"奥术护盾", type:"buff", mp:25, cd:5, unlock:16, buff:{mdf:0.5,def:0.5,turns:3}, desc:"3回合内魔防、物防+50%。" },
  arcane_blast:  { name:"奥术气爆", type:"magical", scale:"mat", power:2.1, mp:32, cd:2, unlock:24, pen:0.3, desc:"210%魔攻并无视30%魔防。" },
  /* 牧师 */
  smite:    { name:"惩击",     type:"magical", scale:"mat", power:1.4, mp:8,  cd:0, unlock:1,  desc:"140%魔攻神圣伤害。" },
  heal:     { name:"治疗轻伤", type:"heal", scale:"mat", power:2.0, mp:20, cd:1, unlock:3,  desc:"恢复200%魔攻的生命。" },
  holy_nova:{ name:"神圣新星", type:"magical", scale:"mat", power:1.3, mp:24, cd:2, unlock:8,  aoe:true, healSelf:0.5, desc:"群体130%魔攻并回复自身。" },
  renew:    { name:"恢复",     type:"buff", mp:18, cd:4, unlock:14, buff:{hpregen:0.15,mdf:0.3,turns:4}, desc:"4回合持续回血并提升魔防。" },
  judgement:{ name:"璀璨光华", type:"magical", scale:"mat", power:2.6, mp:40, cd:4, unlock:24, pen:0.25, desc:"260%魔攻神圣审判,无视25%魔防。" },
  /* 圣骑士 */
  holy_strike:    { name:"圣击",     type:"physical", scale:"atk", power:1.5, mp:6,  cd:0, unlock:1,  desc:"150%物攻神圣打击。" },
  shield_of_faith:{ name:"信仰护盾", type:"buff", mp:20, cd:4, unlock:6,  buff:{def:0.5,mdf:0.4,turns:3}, desc:"3回合内物防+50%、魔防+40%。" },
  consecration:   { name:"奉献",     type:"magical", scale:"mat", power:1.1, mp:24, cd:2, unlock:10, aoe:true, desc:"群体110%魔攻神圣领域。" },
  lay_on_hands:   { name:"圣疗术",   type:"heal", scale:"mat", power:1.8, mp:22, cd:2, unlock:14, healStr:true, desc:"恢复(180%魔攻+50%物攻)的生命。" },
  divine_storm:   { name:"神圣风暴", type:"physical", scale:"atk", power:1.4, mp:34, cd:4, unlock:24, aoe:true, lifesteal:0.3, desc:"群体140%物攻并吸血。" },

  /* ===== 转职专属技能(仅转职解锁,unlock设极高) ===== */
  // 盗贼
  plunder:        { name:"洗劫",     type:"physical", scale:"atk", power:1.3, mp:30, cd:4, unlock:999, aoe:true, steal:0.4, lifesteal:0.2, desc:"【大盗贼】群体130%物攻,偷取全场金币并吸血。" },
  ambush:         { name:"伏击",     type:"physical", scale:"atk", power:2.6, mp:28, cd:3, unlock:999, exec:0.4, critUp:0.3, desc:"【暗影盗贼】260%物攻,暴击率+30%,残血必杀。" },
  shadow_dance:   { name:"影舞",     type:"physical", scale:"atk", power:0.9, mp:40, cd:4, unlock:999, hits:5, desc:"【影舞者】5连击,每击90%物攻,刀刀致命。" },
  divine_arbitration:{ name:"天神仲裁", type:"physical", scale:"atk", power:3.2, mp:45, cd:5, unlock:999, exec:0.5, desc:"【死神】320%物攻终极一击,目标半血以下伤害翻倍。" },
  // 战士
  shield_wall:    { name:"盾墙",     type:"buff", mp:26, cd:5, unlock:999, buff:{def:0.8,mdf:0.6,hpregen:0.08,turns:3}, desc:"【盾甲战士】3回合内物防+80%、魔防+60%并回血。" },
  rampage:        { name:"狂暴",     type:"buff", mp:26, cd:5, unlock:999, buff:{atk:0.6,crit:0.2,spd:0.3,turns:3}, desc:"【狂剑士】3回合内物攻+60%、暴击+20%、速度+30%。" },
  titan_strike:   { name:"泰坦之击", type:"physical", scale:"atk", power:3.0, mp:42, cd:4, unlock:999, exec:0.3, desc:"【神武士】300%物攻,毁灭一击。" },
  blade_storm:    { name:"剑刃风暴", type:"physical", scale:"atk", power:1.6, mp:44, cd:4, unlock:999, aoe:true, hits:2, desc:"【大剑士】群体2段,每段160%物攻。" },
  // 法师
  meteor:         { name:"陨石术",   type:"magical", scale:"mat", power:2.8, mp:46, cd:4, unlock:999, aoe:true, desc:"【元素法师】群体280%魔攻陨石轰炸。" },
  arcane_barrage: { name:"奥术弹幕", type:"magical", scale:"mat", power:0.8, mp:46, cd:4, unlock:999, hits:5, pen:0.2, desc:"【奥术法师】5发弹幕,每发80%魔攻并穿透。" },
  cataclysm:      { name:"灾变",     type:"magical", scale:"mat", power:3.4, mp:60, cd:5, unlock:999, aoe:true, pen:0.3, desc:"【魔导师】群体340%魔攻天灾。" },
  pyroblast:      { name:"炎爆术",   type:"magical", scale:"mat", power:3.8, mp:55, cd:5, unlock:999, desc:"【大法师】380%魔攻炎爆单体毁灭。" },
  // 牧师
  holy_word:      { name:"圣言术",   type:"magical", scale:"mat", power:2.4, mp:40, cd:3, unlock:999, healSelf:0.8, desc:"【圣言牧师】240%魔攻并大量回复自身。" },
  shadow_word:    { name:"暗言·灭", type:"magical", scale:"mat", power:2.0, mp:38, cd:3, unlock:999, dot:{pct:0.5,turns:3}, desc:"【暗牧】200%魔攻并施加致命腐蚀。" },
  divine_radiance:{ name:"圣光普照", type:"magical", scale:"mat", power:3.0, mp:58, cd:5, unlock:999, aoe:true, healSelf:1.2, desc:"【神牧】群体300%魔攻并大幅治疗。" },
  // 圣骑士
  avenging_wrath: { name:"复仇之怒", type:"buff", mp:30, cd:5, unlock:999, buff:{atk:0.5,mat:0.5,crit:0.15,turns:3}, desc:"【守护骑士】3回合内物攻、魔攻+50%、暴击+15%。" },
  silence:        { name:"禁言",     type:"physical", scale:"atk", power:1.8, mp:30, cd:3, unlock:999, stun:2, desc:"【禁言圣骑士】180%物攻并禁锢目标2回合。" },
  divine_judgement:{ name:"神圣审判", type:"physical", scale:"atk", power:3.2, mp:50, cd:5, unlock:999, pen:0.25, desc:"【圣剑士】320%物攻神圣审判,无视25%防御。" },
};

/* ============================================================
 *  被动技能(原著"专长"系统:常驻生效,随等级自动领悟)
 *  add=固定加成, pct=百分比加成(基于基础值)
 * ============================================================ */
GameData.PASSIVES = {
  // 盗贼
  p_dagger:   { name:"武器专精·匕首", unlock:3,  pct:{atk:0.08}, desc:"物攻+8%" },
  p_nimble:   { name:"灵活移动",     unlock:5,  add:{dodge:8}, desc:"闪避+8%" },
  p_deft:     { name:"巧手",         unlock:7,  add:{crit:10}, desc:"暴击率+10%" },
  p_stealth:  { name:"潜行强化",     unlock:12, add:{crit:5,spd:5}, desc:"暴击+5%、速度+5" },
  // 战士
  p_heavyarm: { name:"重甲精通",     unlock:3,  pct:{hp:0.12,def:0.15}, desc:"生命+12%、物防+15%" },
  p_block:    { name:"格挡",         unlock:7,  pct:{def:0.1}, add:{mdf:8}, desc:"物防+10%、魔防+8" },
  p_2hspec:   { name:"双手武器专精", unlock:10, pct:{atk:0.1}, add:{critDmg:25}, desc:"物攻+10%、暴伤+25%" },
  p_rage:     { name:"怒气奔涌",     unlock:13, add:{hpregen:6}, desc:"每回合回血+6" },
  // 法师
  p_element:  { name:"元素亲和",     unlock:4,  pct:{mat:0.12}, desc:"魔攻+12%" },
  p_mana:     { name:"法力涌动",     unlock:6,  pct:{mp:0.15}, desc:"法力+15%" },
  p_arcane:   { name:"奥术增幅",     unlock:10, add:{crit:10,critDmg:30}, desc:"暴击+10%、暴伤+30%" },
  p_focus:    { name:"专注",         unlock:13, add:{mdf:15}, desc:"魔防+15" },
  // 牧师
  p_will:     { name:"意志",         unlock:4,  pct:{mdf:0.15}, desc:"魔防+15%" },
  p_regen:    { name:"回蓝精通",     unlock:6,  pct:{mp:0.1}, add:{hpregen:5}, desc:"法力+10%、回血+5" },
  p_healup:   { name:"治疗强化",     unlock:10, pct:{mat:0.1}, desc:"魔攻(治疗量)+10%" },
  p_shadow:   { name:"暗影亲和",     unlock:13, add:{crit:8,critDmg:20}, desc:"暴击+8%、暴伤+20%" },
  // 圣骑士
  p_piety:    { name:"虔诚光环",     unlock:4,  pct:{atk:0.08,mat:0.08}, desc:"物攻、魔攻+8%" },
  p_shieldm:  { name:"圣盾精通",     unlock:7,  pct:{def:0.12}, add:{hpregen:4}, desc:"物防+12%、回血+4" },
  p_holy:     { name:"光明亲和",     unlock:10, pct:{mat:0.1}, add:{hpregen:4}, desc:"魔攻+10%、回血+4" },
  p_bulwark:  { name:"神圣壁垒",     unlock:13, pct:{hp:0.1}, add:{mdf:10}, desc:"生命+10%、魔防+10" },
};
GameData.CLASS_PASSIVES = {
  rogue:   ["p_dagger","p_nimble","p_deft","p_stealth"],
  warrior: ["p_heavyarm","p_block","p_2hspec","p_rage"],
  mage:    ["p_element","p_mana","p_arcane","p_focus"],
  priest:  ["p_will","p_regen","p_healup","p_shadow"],
  paladin: ["p_piety","p_shieldm","p_holy","p_bulwark"],
};

/* ============================================================
 *  转职(取材原著转职链)
 *  t1@30级 t2@60级,每阶二选一,给永久属性加成+专属技能
 * ============================================================ */
GameData.ADVANCE = {
  rogue: {
    t1:{ level:30, options:[
      { id:"great_thief", name:"大盗贼", desc:"偷窃与续航的极致,群体洗劫。", bonus:{atk:25,crit:6,lifesteal:3}, skills:["plunder"] },
      { id:"shadow_thief", name:"暗影盗贼", desc:"潜行爆发,残血斩杀。", bonus:{atk:30,critDmg:25,spd:4}, skills:["ambush"] },
    ]},
    t2:{ level:60, options:[
      { id:"shadowdancer", name:"影舞者", desc:"全大陆仅六人的盗贼荣耀,刀刀致命。", bonus:{atk:60,crit:10,spd:8,critDmg:30}, skills:["shadow_dance"] },
      { id:"reaper", name:"死神", desc:"收割生命的终结者。", bonus:{atk:70,critDmg:40,lifesteal:5}, skills:["divine_arbitration"] },
    ]},
  },
  warrior: {
    t1:{ level:30, options:[
      { id:"shield_warrior", name:"盾甲战士", desc:"坚不可摧的前排坦克。", bonus:{hp:300,def:30,mdf:20}, skills:["shield_wall"] },
      { id:"berserker", name:"狂剑士", desc:"以攻代守的狂暴输出。", bonus:{atk:35,crit:6,spd:4}, skills:["rampage"] },
    ]},
    t2:{ level:60, options:[
      { id:"god_warrior", name:"神武士", desc:"战场之神,一击毁灭。", bonus:{atk:70,hp:400,crit:6}, skills:["titan_strike"] },
      { id:"sword_master", name:"大剑士", desc:"群战之王,剑刃风暴。", bonus:{atk:60,def:30,critDmg:30}, skills:["blade_storm"] },
    ]},
  },
  mage: {
    t1:{ level:30, options:[
      { id:"elementalist", name:"元素法师", desc:"冰火雷,杀伤最高。", bonus:{mat:35,crit:5}, skills:["meteor"] },
      { id:"arcanist", name:"奥术法师", desc:"奥术穿透,弹幕压制。", bonus:{mat:30,mp:80,critDmg:25}, skills:["arcane_barrage"] },
    ]},
    t2:{ level:60, options:[
      { id:"archmage_dark", name:"魔导师", desc:"高感知克制盗贼,灾变天灾。", bonus:{mat:75,mp:150,crit:6}, skills:["cataclysm"] },
      { id:"archmage", name:"大法师", desc:"单体毁灭的炎爆术。", bonus:{mat:80,critDmg:40}, skills:["pyroblast"] },
    ]},
  },
  priest: {
    t1:{ level:30, options:[
      { id:"holy_priest", name:"圣言牧师", desc:"神圣输出与超强续航。", bonus:{mat:30,hpregen:5,mdf:15}, skills:["holy_word"] },
      { id:"shadow_priest", name:"暗牧", desc:"以暗影腐蚀敌人。", bonus:{mat:35,critDmg:25}, skills:["shadow_word"] },
    ]},
    t2:{ level:60, options:[
      { id:"god_priest", name:"神牧", desc:"圣光普照,生死予夺。", bonus:{mat:75,hp:300,hpregen:8}, skills:["divine_radiance"] },
    ]},
  },
  paladin: {
    t1:{ level:30, options:[
      { id:"guardian", name:"守护骑士", desc:"复仇之怒,攻守兼备。", bonus:{atk:25,mat:25,hp:250}, skills:["avenging_wrath"] },
      { id:"silencer", name:"禁言圣骑士", desc:"禁锢敌人,压制法系。", bonus:{atk:30,def:25,mdf:20}, skills:["silence"] },
    ]},
    t2:{ level:60, options:[
      { id:"sword_saint", name:"圣剑士", desc:"神圣审判,无可抵挡。", bonus:{atk:65,mat:40,hp:350}, skills:["divine_judgement"] },
    ]},
  },
};

/* ---------- 装备部位 ---------- */
GameData.SLOTS = {
  weapon:{ name:"武器", icon:"🗡️" },
  helm:  { name:"头盔", icon:"⛑️" },
  armor: { name:"护甲", icon:"🛡️" },
  boots: { name:"鞋子", icon:"👢" },
  amulet:{ name:"项链", icon:"📿" },
  ring:  { name:"戒指", icon:"💍" },
};

/* ---------- 装备品质(原著链:白装→青铜→白银→黄金→暗金→传奇) ---------- */
// 去随机词缀:每品质 mult=主属性倍率, statBudget=额外属性点数(分配到职业相关属性), sockets=凹槽
GameData.RARITY = {
  white:    { name:"白装", color:"#c8c8c8", mult:1.0,  statBudget:0, sockets:0, weight:50 },
  bronze:   { name:"青铜", color:"#c98a4a", mult:1.25, statBudget:1, sockets:0, weight:28 },
  silver:   { name:"白银", color:"#b9c7d6", mult:1.6,  statBudget:2, sockets:0, weight:13 },
  gold:     { name:"黄金", color:"#ffcf3e", mult:2.1,  statBudget:4, sockets:2, weight:6 },
  darkgold: { name:"暗金", color:"#ff7a18", mult:2.8,  statBudget:6, sockets:3, weight:2.5 },
  legend:   { name:"传奇", color:"#e23bff", mult:3.8,  statBudget:9, sockets:5, weight:0.5 },
};
GameData.RARITY_ORDER = ["white","bronze","silver","gold","darkgold","legend"];

/* ---------- 护甲/武器类型 与 职业限制 ---------- */
GameData.ARMOR_TYPES = {
  cloth:   { name:"布甲", classes:["mage","priest"] },
  leather: { name:"皮甲", classes:["rogue"] },
  mail:    { name:"锁甲", classes:["paladin"] },
  plate:   { name:"板甲", classes:["warrior","paladin"] },
};
GameData.WEAPON_TYPES = {
  dagger:  { name:"匕首", classes:["rogue"],   stat:"atk" },
  bow:     { name:"长弓", classes:["rogue"],   stat:"atk" },
  staff:   { name:"法杖", classes:["mage","priest"], stat:"mat" },
  sword:   { name:"长剑", classes:["warrior"], stat:"atk" },
  axe:     { name:"巨斧", classes:["warrior"], stat:"atk" },
  sword1h: { name:"单手剑", classes:["paladin"], stat:"atk" },
};
// 各职业默认护甲与可用武器(用于掉落生成)
GameData.CLASS_GEAR = {
  warrior: { armor:"plate",   weapons:["sword","axe"] },
  paladin: { armor:"mail",    weapons:["sword1h"] },
  rogue:   { armor:"leather", weapons:["dagger","bow"] },
  mage:    { armor:"cloth",   weapons:["staff"] },
  priest:  { armor:"cloth",   weapons:["staff"] },
};
// 护甲部位(需职业匹配) vs 通用部位(项链戒指,人人可戴)
GameData.ARMOR_SLOTS = ["helm","armor","boots"];
GameData.UNIVERSAL_SLOTS = ["amulet","ring"];

GameData.SLOT_BASE = {
  weapon:{ atk:6, mat:6 },
  helm:  { def:4, hp:18 },
  armor: { def:6, hp:30 },
  boots: { spd:3, dodge:2 },
  amulet:{ mat:4, mdf:4 },
  ring:  { crit:3, atk:3 },
};

/* ---------- 材料(原著材料,小怪主掉) ---------- */
GameData.MATERIALS = {
  rat_tail:    { name:"巨鼠尾巴",   icon:"🐁", tier:1, sell:2 },
  bat_tooth:   { name:"蝙蝠牙齿",   icon:"🦷", tier:1, sell:2 },
  animal_fur:  { name:"动物皮毛",   icon:"🟫", tier:1, sell:3 },
  spider_silk: { name:"精丝",       icon:"🕸️", tier:1, sell:4 },
  fish_scale:  { name:"鱼鳞皮",     icon:"🐟", tier:2, sell:5 },
  ancient_bark:{ name:"古树皮",     icon:"🪵", tier:2, sell:6 },
  herb:        { name:"药草",       icon:"🌿", tier:2, sell:5 },
  bone_frag:   { name:"骨片",       icon:"🦴", tier:3, sell:8 },
  iron_ore:    { name:"黑铁晶石",   icon:"⛏️", tier:3, sell:10 },
  fire_essence:{ name:"火焰精华",   icon:"🔥", tier:4, sell:15 },
  ice_crystal: { name:"寒冰结晶",   icon:"❄️", tier:4, sell:15 },
  void_dust:   { name:"虚空之尘",   icon:"🌫️", tier:5, sell:25 },
  magma_core:  { name:"熔岩核心",   icon:"🌋", tier:6, sell:40 },
  dragon_scale:{ name:"龙鳞",       icon:"🐲", tier:6, sell:50 },
  lucky_gem:   { name:"幸运宝石",   icon:"💎", tier:5, sell:30 }, // 强化材料(Phase2用)
};
// 怪物 -> 主掉材料
GameData.MONSTER_MAT = {
  greyrat:"rat_tail", plainwolf:"animal_fur", cavebat:"bat_tooth", goblin:"animal_fur",
  treant:"ancient_bark", spider:"spider_silk", watspider:"spider_silk", swamplizard:"fish_scale",
  lion:"animal_fur", werewolf:"animal_fur", zombie:"bone_frag", ghost:"void_dust",
  skeleton:"bone_frag", skmage:"bone_frag", murloc:"fish_scale", imp:"fire_essence",
  fireelem:"fire_essence", rockspider:"iron_ore", ogre:"bone_frag", mudgolem:"iron_ore",
  voidspawn:"void_dust", undead:"bone_frag", demonkin:"void_dust", dragonkin:"dragon_scale",
  mecha:"iron_ore", energymecha:"iron_ore", darkmaiden:"void_dust", shadowfiend:"void_dust",
  icewraith:"ice_crystal", lavafiend:"fire_essence", voidlord:"void_dust",
};
// Boss 稀有材料
GameData.MONSTER_MAT_BOSS = {
  treantking:"ancient_bark", flamefiend:"fire_essence", deeplich:"void_dust",
  purpledragon:"dragon_scale", lavabehemoth:"magma_core", orderguardian:"dragon_scale",
};

GameData.EQ_PREFIX = ["破旧的","青铜","锋利的","坚固的","白银","闪光的","黄金","狂暴的","幽影的","暗金","炽焰的","寒冰的","逐火者","永夜","秩序","龙鳞","虚空","星辰"];
GameData.EQ_NAME = {
  weapon:["匕首","短剑","长剑","巨斧","法杖","长弓","权杖","战锤","细剑","魔典"],
  helm:["皮帽","铁盔","头巾","王冠","兜帽","面甲"],
  armor:["布衣","锁甲","板甲","法袍","皮甲","战铠"],
  boots:["布鞋","战靴","轻靴","法靴","踏云靴"],
  amulet:["护符","项链","吊坠","圣徽","宝石链"],
  ring:["铜戒","银戒","宝石戒","符文戒","龙纹戒"],
};

/* ============================================================
 *  怪物(取材原著:亚特兰大陆生物 + 怪物等级体系)
 *  等级:普通→头领→亚精英→精英→领主→BOSS
 * ============================================================ */
GameData.MONSTERS = {
  plainwolf: { name:"草原野狼", icon:"🐺", type:"physical", hpM:7,  atkM:1.1, defM:0.6, spd:12, xp:6,  gold:4 },
  cavebat:   { name:"洞穴蝙蝠", icon:"🦇", type:"physical", hpM:6,  atkM:1.0, defM:0.5, spd:14, xp:6,  gold:5 },
  goblin:    { name:"哥布林",   icon:"👺", type:"physical", hpM:10, atkM:1.2, defM:0.9, spd:10, xp:10, gold:9 },
  treant:    { name:"树妖",     icon:"🌳", type:"physical", hpM:12, atkM:1.3, defM:1.0, spd:7,  xp:12, gold:10 },
  spider:    { name:"毒蜘蛛",   icon:"🕷️", type:"physical", hpM:9,  atkM:1.4, defM:0.6, spd:14, xp:11, gold:8 },
  werewolf:  { name:"狼人",     icon:"🐺", type:"physical", hpM:13, atkM:1.5, defM:0.9, spd:13, xp:15, gold:13 },
  zombie:    { name:"腐尸",     icon:"🧟", type:"physical", hpM:14, atkM:1.3, defM:0.9, spd:6,  xp:14, gold:11 },
  ghost:     { name:"怨灵",     icon:"👻", type:"magical",  hpM:10, atkM:1.6, defM:0.7, spd:13, xp:16, gold:14 },
  imp:       { name:"小恶魔",   icon:"😈", type:"magical",  hpM:11, atkM:1.7, defM:0.8, spd:12, xp:18, gold:15 },
  fireelem:  { name:"火元素",   icon:"🔥", type:"magical",  hpM:13, atkM:1.8, defM:1.0, spd:11, xp:20, gold:17 },
  rockspider:{ name:"岩石蜘蛛", icon:"🕸️", type:"physical", hpM:15, atkM:1.6, defM:1.4, spd:9,  xp:22, gold:18 },
  ogre:      { name:"食人魔",   icon:"👹", type:"physical", hpM:20, atkM:1.7, defM:1.5, spd:6,  xp:24, gold:22 },
  mudgolem:  { name:"泥潭巨人", icon:"🗿", type:"physical", hpM:22, atkM:1.6, defM:1.8, spd:5,  xp:26, gold:24 },
  murloc:    { name:"鱼人",     icon:"🐟", type:"physical", hpM:16, atkM:1.8, defM:1.1, spd:11, xp:28, gold:26 },
  voidspawn: { name:"虚空爬虫", icon:"🐙", type:"magical",  hpM:16, atkM:2.0, defM:1.1, spd:14, xp:32, gold:30 },
  undead:    { name:"亡灵战士", icon:"☠️", type:"physical", hpM:18, atkM:2.0, defM:1.4, spd:11, xp:34, gold:30 },
  demonkin:  { name:"魔裔战士", icon:"😡", type:"physical", hpM:18, atkM:2.1, defM:1.3, spd:13, xp:36, gold:33 },
  dragonkin: { name:"龙人",     icon:"🦎", type:"physical", hpM:18, atkM:2.2, defM:1.5, spd:13, xp:38, gold:36 },
  // —— 扩展:原著各等级带怪物 ——
  greyrat:   { name:"银灰巨鼠", icon:"🐀", type:"physical", hpM:6,  atkM:0.9, defM:0.4, spd:8,  xp:5,  gold:4 },
  watspider: { name:"水蜘蛛",   icon:"🕷️", type:"physical", hpM:8,  atkM:1.1, defM:0.6, spd:12, xp:8,  gold:7 },
  swamplizard:{name:"沼泽巨蜥", icon:"🦎", type:"physical", hpM:13, atkM:1.4, defM:1.0, spd:8,  xp:14, gold:12 },
  lion:      { name:"草原狮",   icon:"🦁", type:"physical", hpM:12, atkM:1.6, defM:0.8, spd:13, xp:15, gold:13 },
  skeleton:  { name:"骷髅兵",   icon:"💀", type:"physical", hpM:11, atkM:1.4, defM:1.1, spd:9,  xp:14, gold:12 },
  skmage:    { name:"骷髅法师", icon:"☠️", type:"magical",  hpM:9,  atkM:1.9, defM:0.7, spd:11, xp:18, gold:15 },
  mecha:     { name:"机械魔偶", icon:"🤖", type:"physical", hpM:22, atkM:1.8, defM:2.0, spd:6,  xp:30, gold:28 },
  energymecha:{name:"能源魔偶", icon:"⚙️", type:"magical",  hpM:24, atkM:2.1, defM:1.8, spd:9,  xp:36, gold:34 },
  darkmaiden:{ name:"黑暗侍女", icon:"🦇", type:"magical",  hpM:18, atkM:2.3, defM:1.2, spd:13, xp:42, gold:38 },
  shadowfiend:{name:"阴影魔仆", icon:"🌑", type:"magical",  hpM:20, atkM:2.4, defM:1.3, spd:14, xp:46, gold:42 },
  icewraith: { name:"寒冰幽魂", icon:"❄️", type:"magical",  hpM:20, atkM:2.3, defM:1.4, spd:12, xp:48, gold:44 },
  lavafiend: { name:"熔岩魔",   icon:"🔥", type:"magical",  hpM:24, atkM:2.6, defM:1.6, spd:11, xp:55, gold:50 },
  voidlord:  { name:"虚空领主仆", icon:"🐙", type:"magical", hpM:24, atkM:2.7, defM:1.5, spd:14, xp:60, gold:56 },
  // BOSS(原著名)
  treantking: { name:"树妖王",       icon:"🌲", boss:true, type:"physical", hpM:30, atkM:1.8, defM:1.2, spd:9,  xp:90,  gold:140 },
  werewolfboso:{ name:"巡回者狼人布索",icon:"🐾", boss:true, type:"physical", hpM:34, atkM:2.2, defM:1.3, spd:14, xp:150, gold:220 },
  flamefiend: { name:"逐火魔将",     icon:"🔆", boss:true, type:"magical",  hpM:40, atkM:2.4, defM:1.6, spd:12, xp:240, gold:340 },
  ogredevourer:{ name:"食人魔吞食者", icon:"😼", boss:true, type:"physical", hpM:46, atkM:2.5, defM:1.9, spd:9,  xp:340, gold:480 },
  deeplich:   { name:"深海巫妖",     icon:"🧊", boss:true, type:"magical",  hpM:50, atkM:2.7, defM:1.8, spd:13, xp:480, gold:660 },
  orderguardian:{name:"秩序镇守者",   icon:"🐉", boss:true, type:"physical", hpM:62, atkM:3.2, defM:2.3, spd:14, xp:760, gold:1100 },
  // —— 扩展BOSS ——
  watspiderlord:{name:"水蜘蛛头领", icon:"🕸️", boss:true, type:"physical", hpM:22, atkM:1.5, defM:0.9, spd:12, xp:50,  gold:70 },
  snakelizard:{ name:"蛇蜥",       icon:"🐍", boss:true, type:"physical", hpM:26, atkM:1.8, defM:1.1, spd:11, xp:70,  gold:100 },
  lionking:   { name:"狮王卡多",   icon:"🦁", boss:true, type:"physical", hpM:30, atkM:2.0, defM:1.2, spd:13, xp:110, gold:160 },
  skgladiator:{ name:"骷髅角斗士", icon:"⚔️", boss:true, type:"physical", hpM:36, atkM:2.2, defM:1.5, spd:11, xp:180, gold:260 },
  goblinhunter:{name:"地精寻猎者", icon:"🔫", boss:true, type:"magical",  hpM:48, atkM:2.6, defM:1.7, spd:12, xp:400, gold:560 },
  shadowdemon:{ name:"阴影魔王",   icon:"😈", boss:true, type:"magical",  hpM:70, atkM:3.4, defM:2.2, spd:15, xp:1000,gold:1500 },
  purpledragon:{name:"紫瞳地龙",   icon:"🐲", boss:true, type:"physical", hpM:85, atkM:3.8, defM:2.6, spd:14, xp:1500,gold:2200 },
  fallenangel:{ name:"堕落天使",   icon:"👼", boss:true, type:"magical",  hpM:100,atkM:4.2, defM:2.8, spd:15, xp:2400,gold:3600 },
  lavabehemoth:{name:"熔岩巨兽",   icon:"🌋", boss:true, type:"physical", hpM:130,atkM:4.8, defM:3.2, spd:13, xp:4000,gold:6000 },
};

/* ============================================================
 *  地图(取材原著:卡罗尔城周边 + 副本)
 * ============================================================ */
GameData.MAPS = [
  { id:"carol_plain",  name:"卡罗尔大草原", icon:"🌾", lv:1,   monsters:["greyrat","plainwolf","cavebat"],     boss:null,           unlock:null,          dropBonus:0 },
  { id:"lake_rondo",   name:"然多湖",       icon:"🏞️", lv:4,   monsters:["murloc","watspider"],               boss:"watspiderlord",unlock:"carol_plain", dropBonus:0 },
  { id:"treant_forest",name:"树妖林",       icon:"🌲", lv:7,   monsters:["treant","goblin","spider"],         boss:"treantking",   unlock:"lake_rondo",  dropBonus:0 },
  { id:"nat_swamp",    name:"纳特兰沼泽",   icon:"🐊", lv:11,  monsters:["swamplizard","spider","watspider"], boss:"snakelizard",  unlock:"treant_forest",dropBonus:1 },
  { id:"fmeadow",      name:"绯梦平原",     icon:"🌸", lv:15,  monsters:["lion","goblin","plainwolf"],        boss:"lionking",     unlock:"nat_swamp",   dropBonus:1 },
  { id:"soss_valley",  name:"索斯山谷",     icon:"⛰️", lv:20,  monsters:["werewolf","zombie","ghost"],        boss:"werewolfboso", unlock:"fmeadow",     dropBonus:1 },
  { id:"sogot_city",   name:"索哥特古城",   icon:"⚰️", lv:26,  monsters:["skeleton","skmage","zombie"],       boss:"skgladiator",  unlock:"soss_valley", dropBonus:2 },
  { id:"molten_forest",name:"熔火森林",     icon:"🌋", lv:32,  monsters:["imp","fireelem","rockspider"],      boss:"flamefiend",   unlock:"sogot_city",  dropBonus:2 },
  { id:"gray_swamp",   name:"灰暗泥潭",     icon:"🥾", lv:38,  monsters:["ogre","mudgolem","ghost"],          boss:"ogredevourer", unlock:"molten_forest",dropBonus:2 },
  { id:"eternal_city", name:"永恒之城",     icon:"🏛️", lv:45,  monsters:["mecha","energymecha","rockspider"], boss:"goblinhunter", unlock:"gray_swamp",  dropBonus:3 },
  { id:"sorlens",      name:"索伦斯深渊",   icon:"🌊", lv:52,  monsters:["murloc","voidspawn","undead"],      boss:"deeplich",     unlock:"eternal_city",dropBonus:3 },
  { id:"hilton",       name:"希尔顿要塞",   icon:"🏰", lv:60,  monsters:["demonkin","dragonkin","undead"],    boss:"orderguardian",unlock:"sorlens",     dropBonus:3 },
  { id:"shadow_domain",name:"黑暗死域",     icon:"🕳️", lv:72,  monsters:["shadowfiend","darkmaiden","voidspawn"],boss:"shadowdemon",unlock:"hilton",      dropBonus:4 },
  { id:"dragon_lair",  name:"紫瞳龙穴",     icon:"🐉", lv:88,  monsters:["dragonkin","lavafiend","icewraith"],boss:"purpledragon", unlock:"shadow_domain",dropBonus:4 },
  { id:"world_barrier",name:"世界壁垒",     icon:"🌌", lv:105, monsters:["voidlord","shadowfiend","demonkin"],boss:"fallenangel",  unlock:"dragon_lair", dropBonus:5 },
  { id:"molten_abyss", name:"熔火之渊",     icon:"☄️", lv:120, monsters:["lavafiend","lavabehemoth","voidlord"],boss:"lavabehemoth",unlock:"world_barrier",dropBonus:5 },
];

/* ============================================================
 *  具名套装(取材原著:各BOSS掉落对应套装碎片)
 *  bossKey -> 套装定义; Boss击杀有概率掉一件
 * ============================================================ */
// bonus=单件属性额外倍率; setBonus=按已穿件数触发的额外属性(2/4件)
GameData.EQ_SETS = {
  watspiderlord:{ name:"织丝者",  rarity:"bronze",   classHint:"通用",     bonus:1.12, setBonus:{2:{spd:5,dodge:3}} },
  treantking:  { name:"翠羽",     rarity:"silver",   classHint:"通用",     bonus:1.15, setBonus:{2:{hp:80,def:8}} },
  snakelizard: { name:"毒鳞",     rarity:"silver",   classHint:"通用",     bonus:1.18, setBonus:{2:{atk:12,crit:4}} },
  lionking:    { name:"黑血",     rarity:"gold",     classHint:"盗贼/敏捷", bonus:1.2,  setBonus:{2:{atk:18,crit:6},4:{critDmg:30,lifesteal:4}} },
  werewolfboso:{ name:"契约",     rarity:"gold",     classHint:"盗贼/敏捷", bonus:1.22, setBonus:{2:{atk:20,spd:6},4:{crit:8,dodge:6}} },
  skgladiator: { name:"索哥特阴影",rarity:"gold",    classHint:"盗贼",     bonus:1.24, setBonus:{2:{atk:22,dodge:5},4:{critDmg:35}} },
  flamefiend:  { name:"逐火者",   rarity:"gold",     classHint:"法师/火系", bonus:1.26, setBonus:{2:{mat:24,mp:80},4:{crit:8,critDmg:30}} },
  ogredevourer:{ name:"永恒",     rarity:"darkgold", classHint:"战士/防御", bonus:1.3,  setBonus:{2:{hp:300,def:25},4:{mdf:20,hpregen:6}} },
  goblinhunter:{ name:"金属风暴", rarity:"darkgold", classHint:"战士",     bonus:1.32, setBonus:{2:{atk:35,hp:200},4:{crit:8,critDmg:40}} },
  deeplich:    { name:"永夜之寂", rarity:"darkgold", classHint:"盗贼",     bonus:1.35, setBonus:{2:{atk:40,crit:8},4:{critDmg:45,lifesteal:6}} },
  orderguardian:{ name:"秩序",    rarity:"legend",   classHint:"神装·通用", bonus:1.5,  setBonus:{2:{atk:30,mat:30,hp:300},4:{crit:10,critDmg:50,hpregen:10}} },
  shadowdemon: { name:"暗影君王", rarity:"legend",   classHint:"通用",     bonus:1.6,  setBonus:{2:{atk:40,mat:40},4:{crit:12,critDmg:50}} },
  purpledragon:{ name:"龙鳞",     rarity:"legend",   classHint:"通用",     bonus:1.7,  setBonus:{2:{hp:500,def:40},4:{atk:50,mat:50,hpregen:12}} },
  fallenangel: { name:"堕天",     rarity:"legend",   classHint:"通用",     bonus:1.85, setBonus:{2:{atk:55,mat:55},4:{crit:14,critDmg:60,lifesteal:6}} },
  lavabehemoth:{ name:"格瑞玛神装",rarity:"legend",  classHint:"神器·通用", bonus:2.0,  setBonus:{2:{atk:70,mat:70,hp:600},4:{crit:15,critDmg:80,hpregen:15}} },
};

/* ============================================================
 *  宠物(原著确认存在宠物/召唤系统)
 *  提供被动属性加成 + 每回合协助攻击
 * ============================================================ */
GameData.PETS = {
  shadow_wolf: { name:"暗影幼狼", icon:"🐺", rarity:"silver", base:{atk:9,hp:70,def:4,spd:11}, grow:{atk:1.6,hp:13,def:0.8,spd:0.3}, skill:"撕咬", power:0.7 },
  fire_drake:  { name:"火焰雏龙", icon:"🐲", rarity:"gold",   base:{atk:13,hp:90,def:6,spd:9},  grow:{atk:2.0,hp:16,def:1.0,spd:0.2}, skill:"喷火", power:0.85, magical:true },
  spirit_owl:  { name:"灵光枭",   icon:"🦉", rarity:"silver", base:{atk:7,hp:60,def:3,spd:13},  grow:{atk:1.3,hp:11,def:0.6,spd:0.4}, skill:"灵击", power:0.6, magical:true, heal:0.15 },
  stone_golem: { name:"石傀儡",   icon:"🗿", rarity:"gold",   base:{atk:8,hp:140,def:10,spd:5}, grow:{atk:1.2,hp:24,def:1.6,spd:0.1}, skill:"重砸", power:0.55 },
  void_cat:    { name:"虚空魔猫", icon:"🐈‍⬛", rarity:"darkgold", base:{atk:16,hp:100,def:6,spd:14}, grow:{atk:2.4,hp:18,def:1.0,spd:0.4}, skill:"虚空爪", power:1.0 },
  phoenix:     { name:"不死凤雏", icon:"🔥", rarity:"legend", base:{atk:20,hp:160,def:9,spd:13}, grow:{atk:3.0,hp:26,def:1.4,spd:0.4}, skill:"涅槃焰", power:1.2, magical:true, heal:0.25 },
};
GameData.PET_EGG_POOL = [ // 孵蛋权重
  { k:"shadow_wolf", w:34 }, { k:"spirit_owl", w:30 },
  { k:"stone_golem", w:18 }, { k:"fire_drake", w:12 },
  { k:"void_cat", w:5 }, { k:"phoenix", w:1 },
];
GameData.PET_EGG_PRICE = 60; // 信用点

/* ============================================================
 *  每日签到(7天循环)
 * ============================================================ */
GameData.SIGNIN = [
  { day:1, reward:{ gold:200 } },
  { day:2, reward:{ item:{id:"hp_potion_m",count:3} } },
  { day:3, reward:{ gold:600 } },
  { day:4, reward:{ diamond:10 } },
  { day:5, reward:{ item:{id:"hp_potion_l",count:3} } },
  { day:6, reward:{ diamond:20 } },
  { day:7, reward:{ petEgg:true, diamond:30 } },
];

/* ---------- 消耗品 / 商店 ---------- */
GameData.CONSUMABLES = {
  hp_potion_s:{ name:"初级治疗药剂", icon:"🧪", desc:"恢复120点生命", heal:120, price:30 },
  hp_potion_m:{ name:"中级治疗药剂", icon:"🧪", desc:"恢复350点生命", heal:350, price:90 },
  hp_potion_l:{ name:"高级治疗药剂", icon:"🍷", desc:"恢复800点生命", heal:800, price:220 },
  mp_potion_s:{ name:"初级法力药剂", icon:"💧", desc:"恢复60点法力", mana:60, price:30 },
  mp_potion_m:{ name:"中级法力药剂", icon:"💧", desc:"恢复160点法力", mana:160, price:90 },
  town_portal:{ name:"回城卷轴", icon:"📜", desc:"战斗中逃离并满血回城", escape:true, price:50 },
};
GameData.SHOP_ITEMS = ["hp_potion_s","hp_potion_m","hp_potion_l","mp_potion_s","mp_potion_m","town_portal"];

/* 等级经验曲线 */
GameData.xpToNext = function(lv){ return Math.floor(50 * Math.pow(lv,1.55) + 50*lv); };
GameData.MAX_LEVEL = 150;
GameData.POINTS_PER_LEVEL = 3;

/* ============================================================
 *  剧情任务(主线围绕『秩序之章』+ 盗贼成长线)
 * ============================================================ */
GameData.MAIN_QUESTS = [
  { id:"m1", chapter:"序章 · 重生卡罗尔",
    name:"前世的记忆", giver:"老盗贼·卡迪",
    story:"「小子,你的眼神不像新人……罢了。亚特兰大陆从不太平,卡罗尔大草原的野狼最近格外凶。先去练练手,让我看看你担不担得起这把匕首。」",
    objective:{ kind:"kill", mapId:"carol_plain", count:8 },
    reward:{ xp:60, gold:120, item:{id:"hp_potion_m",count:2} } },

  { id:"m2", chapter:"序章 · 阴影的脚步",
    name:"潜行者之路", giver:"老盗贼·卡迪",
    story:"「不错。盗贼的力量不在蛮力,而在阴影与时机。去成长吧——等你够强,我教你真正的盗贼绝活。追逐阴影的脚步,这是盗贼的赞歌。」",
    objective:{ kind:"level", count:5 },
    reward:{ xp:120, gold:160, item:{id:"mp_potion_m",count:2} } },

  { id:"m3", chapter:"第一章 · 树妖林",
    name:"森林之主", giver:"游侠·苏璃",
    story:"「树妖林深处,树妖王戴着一枚漆黑的徽记,正是黑暗之力的造物。它在腐蚀整片森林。猎手,斩下树妖王,这是你扬名卡罗尔的第一战!」",
    objective:{ kind:"boss", mapId:"treant_forest" },
    reward:{ xp:300, gold:400, diamond:5, item:{id:"hp_potion_l",count:2} } },

  { id:"m4", chapter:"第二章 · 索斯山谷",
    name:"狼嚎之谷", giver:"游侠·苏璃",
    story:"「徽记指向索斯山谷。那里的狼人染上了惊怖剧毒,背后是巡回者布索在作祟。先清剿谷中爪牙,削弱它的势力。」",
    objective:{ kind:"kill", mapId:"soss_valley", count:20 },
    reward:{ xp:500, gold:600, item:{id:"hp_potion_l",count:3} } },

  { id:"m5", chapter:"第二章 · 终结布索",
    name:"巡回者的末路", giver:"猎人·铁爪",
    story:"「巡回者狼人布索昼伏夜出,剧毒缠身者无人生还。带上解毒的黑酚药剂,终结这头疯狼,还索斯山谷安宁。」",
    objective:{ kind:"boss", mapId:"soss_valley" },
    reward:{ xp:900, gold:1000, diamond:10 } },

  { id:"m6", chapter:"第三章 · 转职之试",
    name:"大盗贼的传承", giver:"老盗贼·卡迪",
    story:"「你已有资格转职了。转职任务分简单到专家五个难度,越难奖励越丰厚。先证明你的境界——达到指定等级,回卡罗尔城找我转职。」",
    objective:{ kind:"level", count:25 },
    reward:{ xp:1500, gold:1400, item:{id:"hp_potion_l",count:5} } },

  { id:"m7", chapter:"第三章 · 熔火森林",
    name:"逐火者", giver:"流浪法师·伊兰",
    story:"「黑暗之力正撕裂各地封印。熔火森林中,逐火魔将苏醒,岩浆奔涌。它身上有『逐火者』套装的碎片——也是阻止灾祸的关键。去吧。」",
    objective:{ kind:"boss", mapId:"molten_forest" },
    reward:{ xp:2600, gold:2200, diamond:15 } },

  { id:"m8", chapter:"第四章 · 灰暗泥潭",
    name:"吞食者", giver:"炼药师·奥尔",
    story:"「灰暗泥潭的食人魔吞食者,吞噬一切血肉,连泥潭巨人都怕它三分。清理泥潭的怪物,削弱它的食粮,再一举除之。」",
    objective:{ kind:"kill", mapId:"gray_swamp", count:30 },
    reward:{ xp:4000, gold:3400, item:{id:"hp_potion_l",count:6} } },

  { id:"m9", chapter:"第四章 · 泥潭终焉",
    name:"斩杀吞食者", giver:"炼药师·奥尔",
    story:"「这瓶药剂能压制它的再生。吞食者是黑暗投在地表的胃口,若不阻止,整片湿地都将被吞没。动手吧,英雄。」",
    objective:{ kind:"boss", mapId:"gray_swamp" },
    reward:{ xp:6500, gold:5200, diamond:25 } },

  { id:"m10", chapter:"第五章 · 索伦斯深渊",
    name:"深海的低语", giver:"古老的意志·守望者",
    story:"「秩序之章的碎片散落各处。索伦斯深渊里,深海巫妖以亡者之力封锁了『永夜之寂』的传承。汝之力量已近巅峰,但深渊会回以同等的凝视。」",
    objective:{ kind:"level", count:48 },
    reward:{ xp:11000, gold:8000, diamond:30 } },

  { id:"m11", chapter:"第五章 · 永夜之寂",
    name:"巫妖的终结", giver:"古老的意志·守望者",
    story:"「深海巫妖能窥探你的恐惧、复制你的招式。唯有无畏者方能将其斩落。胜利之后,你将直面秩序之章的守护者——也是最后的真相。」",
    objective:{ kind:"boss", mapId:"sorlens" },
    reward:{ xp:18000, gold:14000, diamond:50 } },

  { id:"m12", chapter:"第六章 · 秩序镇守者",
    name:"夺取秩序之章", giver:"古老的意志·守望者",
    story:"「封印混乱的『秩序镇守者』——龙族与巨人结合、受神洗礼的存在,如今被黑暗反噬而疯狂。终结它,夺下它守护的一卷秩序之章。这只是开始——集齐六卷三十六章,你方能成为光明神殿的教皇。」",
    objective:{ kind:"boss", mapId:"hilton" },
    reward:{ xp:40000, gold:30000, diamond:60 } },

  { id:"m13", chapter:"第七章 · 凝视深渊",
    name:"黑暗死域", giver:"大天使·泰洛德",
    story:"「混乱之章的持有者『多多』已在地底崛起,亡灵帝国蠢蠢欲动。黑暗死域是通往地底的门户,阴影魔王在此聚众。先削弱它的爪牙,人类的命运系于你一身。」",
    objective:{ kind:"kill", mapId:"shadow_domain", count:40 },
    reward:{ xp:60000, gold:40000, diamond:50 } },

  { id:"m14", chapter:"第七章 · 阴影魔王",
    name:"斩落阴影", giver:"大天使·泰洛德",
    story:"「阴影魔王的烈焰斩能一击破开圣光盾。但你已非昔日新人——以无畏者之姿,将它斩落,夺回又一卷秩序之章的碎片。」",
    objective:{ kind:"boss", mapId:"shadow_domain" },
    reward:{ xp:90000, gold:70000, diamond:80 } },

  { id:"m15", chapter:"第八章 · 龙族遗产",
    name:"紫瞳龙穴", giver:"野蛮人祭司·克罗耶茨",
    story:"「黑暗年代,龙王泽恩纳德曾奴役万族两千九百年。紫瞳地龙是龙族遗脉,守护着龙族的神兵。屠龙者,去取回属于你的龙之传承吧。」",
    objective:{ kind:"boss", mapId:"dragon_lair" },
    reward:{ xp:140000, gold:110000, diamond:100 } },

  { id:"m16", chapter:"第九章 · 尘封的历史",
    name:"世界壁垒", giver:"光明神·的低语",
    story:"「你已集齐第一卷秩序之章,资料片『尘封的历史』就此开启,历史开始偏离原本的轨迹。世界壁垒之后,是堕天的天使——它『相当于神』。证明人类配得上自由。」",
    objective:{ kind:"kill", mapId:"world_barrier", count:50 },
    reward:{ xp:220000, gold:160000, diamond:120 } },

  { id:"m17", chapter:"第九章 · 堕落天使",
    name:"弑神之战", giver:"光明神·的低语",
    story:"「堕落天使曾是光明的造物,如今坠入虚空。击败它,你将集齐最后的神圣之章,合成『秩序之书』——与多多的混乱之书同时现世,虚空世界即将降临。」",
    objective:{ kind:"boss", mapId:"world_barrier" },
    reward:{ xp:320000, gold:240000, diamond:160 } },

  { id:"m18", chapter:"终章 · 教皇加冕",
    name:"信仰的尽头", giver:"教皇加冕·大典",
    story:"「绿色陨石化作虚空生物席卷大陆,熔火之渊的熔岩巨兽是虚空最后的咆哮。终结它,大天使泰洛德将在卡罗尔城神圣殿堂为你加冕——你将成为光明阵营的教皇,可学秩序之书中的百项神技。孤寂的行者,你的传说终将永世传唱。」",
    objective:{ kind:"boss", mapId:"molten_abyss" },
    reward:{ xp:600000, gold:500000, diamond:300 } },
];

/* ============================================================
 *  职业专属任务链(每职业一条,顺序推进,各具职业特色)
 *  借鉴原著:盗贼=潜行偷窃开锁影舞; 法师=魔法塔进修; 战士=力量格挡;
 *  牧师=信仰治疗; 圣骑士=圣光守护审判
 *  objective 同主线/支线; reward 同结构
 * ============================================================ */
GameData.CLASS_QUESTS = {
  rogue: [
    { id:"cq_rogue_1", title:"潜行者的第一课", giver:"盗贼工会·费瑟斯顿", reqLevel:3,
      story:"「盗贼的胜负,往往取决于第一击是否得手。先去草原磨练你的匕首——记住,潜行想完全不被发现是不可能的,盗贼不是神。」",
      objective:{ kind:"killType", monster:"plainwolf", count:12 },
      reward:{ xp:120, gold:200, item:{id:"hp_potion_m",count:2} } },
    { id:"cq_rogue_2", title:"开锁技艺", giver:"盗贼工会·帕罗特", reqLevel:8,
      story:"「一名合格的盗贼,要能打开任何锁。去树妖林历练,带回足够的战利品证明你的手法。」",
      objective:{ kind:"kill", mapId:"treant_forest", count:20 },
      reward:{ xp:400, gold:400, item:{id:"town_portal",count:3} } },
    { id:"cq_rogue_3", title:"黑血的诱惑", giver:"盗贼工会·费瑟斯顿", reqLevel:14,
      story:"「狮王卡多身上的黑血套装是盗贼梦寐以求的。先在索斯山谷站稳脚跟,搞到一件像样的装备。」",
      objective:{ kind:"equipPower", count:120 },
      reward:{ xp:900, gold:800, diamond:8 } },
    { id:"cq_rogue_4", title:"大盗贼转职试炼", giver:"盗贼工会·费瑟斯顿", reqLevel:30,
      story:"「你已有资格挑战大盗贼转职任务。它随机生成、五个难度,失败惩罚极重。先证明你的实力——清剿熔火森林的精英。」",
      objective:{ kind:"kill", mapId:"molten_forest", count:30 },
      reward:{ xp:3000, gold:2500, diamond:15 } },
    { id:"cq_rogue_5", title:"影舞·盗贼的赞歌", giver:"盗贼工会·费瑟斯顿", reqLevel:55,
      story:"「影舞,是所有盗贼追求的无上荣耀,全大陆仅六人。击败希尔顿要塞的龙人,在阴影中起舞吧——孤寂的行者。」",
      objective:{ kind:"killType", monster:"dragonkin", count:30 },
      reward:{ xp:25000, gold:20000, diamond:60 } },
  ],
  warrior: [
    { id:"cq_war_1", title:"力量的证明", giver:"武器商行·铁壁", reqLevel:3,
      story:"「战士的奥义是力量!别耍花招,正面碾碎草原上的一切,让我看看你的臂力。」",
      objective:{ kind:"kill", mapId:"carol_plain", count:14 },
      reward:{ xp:120, gold:200, item:{id:"hp_potion_m",count:2} } },
    { id:"cq_war_2", title:"格挡之道", giver:"老兵·重盾", reqLevel:8,
      story:"「格挡是近战的至宝。去树妖林,在树妖王的爪牙下学会承受打击与反击。」",
      objective:{ kind:"killType", monster:"treant", count:15 },
      reward:{ xp:400, gold:400, item:{id:"hp_potion_l",count:2} } },
    { id:"cq_war_3", title:"狂剑士的怒火", giver:"狂战士·血斧", reqLevel:14,
      story:"「盾甲与狂剑,你终将选择其一。先用一身硬装备扛住索斯山谷的狼群。」",
      objective:{ kind:"equipPower", count:120 },
      reward:{ xp:900, gold:800, diamond:8 } },
    { id:"cq_war_4", title:"金属风暴", giver:"铸剑师·欧冶", reqLevel:30,
      story:"「金属风暴套装需要极高的力量驾驭。去熔火森林,在烈焰中淬炼你的钢铁意志。」",
      objective:{ kind:"kill", mapId:"molten_forest", count:30 },
      reward:{ xp:3000, gold:2500, diamond:15 } },
    { id:"cq_war_5", title:"神武士之路", giver:"老兵·重盾", reqLevel:55,
      story:"「战场之神,一击毁灭。击溃希尔顿要塞的魔裔大军,证明你配得上神武士的名号!」",
      objective:{ kind:"killType", monster:"demonkin", count:30 },
      reward:{ xp:25000, gold:20000, diamond:60 } },
  ],
  mage: [
    { id:"cq_mage_1", title:"元素的低语", giver:"法师塔·学徒导师", reqLevel:3,
      story:"「信仰里没有最弱的职业,只有最弱的玩家。用你的火球,把草原的野兽烧成灰烬。」",
      objective:{ kind:"kill", mapId:"carol_plain", count:14 },
      reward:{ xp:120, gold:200, item:{id:"mp_potion_m",count:3} } },
    { id:"cq_mage_2", title:"魔法塔进修", giver:"法师塔·奥义导师", reqLevel:8,
      story:"「元素、奥义、圣言——三系之路在你脚下。先去树妖林收集施法经验。」",
      objective:{ kind:"kill", mapId:"treant_forest", count:20 },
      reward:{ xp:400, gold:400, item:{id:"mp_potion_m",count:3} } },
    { id:"cq_mage_3", title:"逐火者与黑暗初冬", giver:"流浪法师·伊兰", reqLevel:14,
      story:"「逐火者属火、黑暗初冬属奥术,都是法师的顶级套装。先用一件好装备武装自己。」",
      objective:{ kind:"equipPower", count:120 },
      reward:{ xp:900, gold:800, diamond:8 } },
    { id:"cq_mage_4", title:"大法师之证", giver:"法师塔·奥义导师", reqLevel:30,
      story:"「转大法师需遗忘旧法、重塑魔力。去熔火森林,与火元素共鸣,领悟更高的奥义。」",
      objective:{ kind:"killType", monster:"fireelem", count:25 },
      reward:{ xp:3000, gold:2500, diamond:15 } },
    { id:"cq_mage_5", title:"魔导师·参悟规则", giver:"法师塔·塔主", reqLevel:55,
      story:"「魔导师能将数值由相加化为相乘,可学三道禁咒。荡平希尔顿要塞,触摸规则的边缘。」",
      objective:{ kind:"kill", mapId:"hilton", count:40 },
      reward:{ xp:25000, gold:20000, diamond:60 } },
  ],
  priest: [
    { id:"cq_priest_1", title:"光明的侍者", giver:"光明神殿·三等教士", reqLevel:3,
      story:"「以神圣之力净化邪祟。去草原,用惩击荡涤那些骚扰村民的野兽。」",
      objective:{ kind:"kill", mapId:"carol_plain", count:14 },
      reward:{ xp:120, gold:200, item:{id:"mp_potion_m",count:3} } },
    { id:"cq_priest_2", title:"治愈之手", giver:"医师·布莱文斯", reqLevel:8,
      story:"「牧师最脆,却最不可或缺。去树妖林历练,学会在险境中保全自己与同伴。」",
      objective:{ kind:"kill", mapId:"treant_forest", count:20 },
      reward:{ xp:400, gold:400, item:{id:"hp_potion_l",count:2} } },
    { id:"cq_priest_3", title:"圣言与暗影", giver:"光明神殿·二等教士", reqLevel:14,
      story:"「圣言牧师播撒神光,暗牧驾驭腐蚀。先用神圣装备坚定你的信仰。」",
      objective:{ kind:"equipPower", count:120 },
      reward:{ xp:900, gold:800, diamond:8 } },
    { id:"cq_priest_4", title:"超度亡魂", giver:"光明神殿·祭司", reqLevel:30,
      story:"「灰暗泥潭的怨灵被黑暗扭曲。以你的神圣之力超度它们,这是牧师的慈悲。」",
      objective:{ kind:"killType", monster:"ghost", count:25 },
      reward:{ xp:3000, gold:2500, diamond:15 } },
    { id:"cq_priest_5", title:"神牧·七大神牧之一", giver:"光明神殿·红衣主教", reqLevel:55,
      story:"「神牧全大陆仅七人,圣光普照、生死予夺。净化希尔顿要塞的亡灵,接受神的考验。」",
      objective:{ kind:"killType", monster:"undead", count:30 },
      reward:{ xp:25000, gold:20000, diamond:60 } },
  ],
  paladin: [
    { id:"cq_pal_1", title:"圣光的誓约", giver:"圣十字军·见习骑士", reqLevel:3,
      story:"「圣骑士以圣光为奥义,攻守兼备。去草原,以神圣打击扫清邪恶生物。」",
      objective:{ kind:"kill", mapId:"carol_plain", count:14 },
      reward:{ xp:120, gold:200, item:{id:"hp_potion_m",count:2} } },
    { id:"cq_pal_2", title:"守护之盾", giver:"圣殿卫队·队长", reqLevel:8,
      story:"「防护邪恶、圣盾术——守护是圣骑士的天职。去树妖林,做队伍的钢铁壁垒。」",
      objective:{ kind:"kill", mapId:"treant_forest", count:20 },
      reward:{ xp:400, gold:400, item:{id:"hp_potion_l",count:2} } },
    { id:"cq_pal_3", title:"海蓝圣光", giver:"圣十字军·军需官", reqLevel:14,
      story:"「海蓝圣光、光辉套装,都是圣骑士的荣耀战甲。先用一件好装备彰显信仰。」",
      objective:{ kind:"equipPower", count:120 },
      reward:{ xp:900, gold:800, diamond:8 } },
    { id:"cq_pal_4", title:"禁言与审判", giver:"圣殿骑士团·团长", reqLevel:30,
      story:"「禁言克制法系,审判轰碎邪恶。前往熔火森林,以圣光制裁那里的恶魔。」",
      objective:{ kind:"killType", monster:"imp", count:25 },
      reward:{ xp:3000, gold:2500, diamond:15 } },
    { id:"cq_pal_5", title:"圣剑士·神圣审判", giver:"大天使·泰洛德的使者", reqLevel:55,
      story:"「神圣审判,无可抵挡。荡平希尔顿要塞的黑暗造物,你将获得圣堂的至高认可。」",
      objective:{ kind:"kill", mapId:"hilton", count:40 },
      reward:{ xp:25000, gold:20000, diamond:60 } },
  ],
};

GameData.SIDE_QUESTS = [
  { id:"s1", name:"草原清剿", giver:"农妇·阿香", region:"carol_plain", reqLevel:1,
    story:"「野狼和蝙蝠又来糟蹋庄稼了,帮我清理一下吧!」",
    objective:{ kind:"kill", mapId:"carol_plain", count:15 },
    reward:{ xp:50, gold:80 }, repeatable:true },

  { id:"s2", name:"蝙蝠牙齿", giver:"铁匠·卡迪", region:"carol_plain", reqLevel:2,
    story:"「蝙蝠牙齿是0级武器的好材料,多打几只蝙蝠给我。」",
    objective:{ kind:"killType", monster:"cavebat", count:12 },
    reward:{ xp:70, gold:100, item:{id:"hp_potion_s",count:3} }, repeatable:true },

  { id:"s3", name:"装备鉴定", giver:"行商·钱多多", region:"treant_forest", reqLevel:6,
    story:"「想做大冒险家,装备可不能寒酸。搞一件像样的装备来给我瞧瞧!」",
    objective:{ kind:"equipPower", count:60 },
    reward:{ xp:200, gold:280, item:{id:"hp_potion_m",count:2} } },

  { id:"s4", name:"超度怨灵", giver:"守墓人·老孤", region:"soss_valley", reqLevel:12,
    story:"「夜夜哭嚎的怨灵不得安宁。超度它们吧。」",
    objective:{ kind:"killType", monster:"ghost", count:18 },
    reward:{ xp:400, gold:400 }, repeatable:true },

  { id:"s5", name:"积累财富", giver:"行商·钱多多", region:"soss_valley", reqLevel:14,
    story:"「信仰里钱币爆率极低,攒够一笔金币,我介绍你入拍卖行!」",
    objective:{ kind:"gold", count:3000 },
    reward:{ xp:500, gold:0, diamond:10 } },

  { id:"s6", name:"熔岩之心", giver:"矿工·火石", region:"molten_forest", reqLevel:20,
    story:"「火元素体内有熔岩之心,锻造神兵的好材料。多打几只!」",
    objective:{ kind:"killType", monster:"fireelem", count:20 },
    reward:{ xp:1200, gold:1200 }, repeatable:true },

  { id:"s7", name:"转职之证", giver:"试炼官·瑞恩", region:"molten_forest", reqLevel:22,
    story:"「真正的勇者不断变强。达到指定境界,我便授你转职之证。」",
    objective:{ kind:"level", count:30 },
    reward:{ xp:2000, gold:2000, diamond:12 } },

  { id:"s8", name:"泥潭清淤", giver:"炼药师·奥尔", region:"gray_swamp", reqLevel:30,
    story:"「泥潭巨人挡住了药草产地,帮我清理一些。」",
    objective:{ kind:"killType", monster:"mudgolem", count:25 },
    reward:{ xp:3500, gold:3000 }, repeatable:true },

  { id:"s9", name:"神兵在手", giver:"铸剑师·欧冶", region:"gray_swamp", reqLevel:34,
    story:"「真正的强者必有神兵。拿一件暗金或战力惊人的装备来,我认你为友!」",
    objective:{ kind:"equipPower", count:400 },
    reward:{ xp:5000, gold:4000, diamond:20 } },

  { id:"s10", name:"虚空净化", giver:"守望者的回响", region:"sorlens", reqLevel:42,
    story:"「虚空爬虫是裂隙的产物,每消灭一只,裂隙便弱一分。」",
    objective:{ kind:"killType", monster:"voidspawn", count:30 },
    reward:{ xp:9000, gold:8000, diamond:18 }, repeatable:true },

  { id:"s11", name:"屠龙之志", giver:"吟游诗人·风行", region:"hilton", reqLevel:55,
    story:"「龙人是秩序镇守者的爪牙,是通往要塞核心的最后考验。证明你的屠龙之志!」",
    objective:{ kind:"killType", monster:"dragonkin", count:40 },
    reward:{ xp:20000, gold:18000, diamond:40 }, repeatable:true },
];
