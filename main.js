/* ============================================================
 *  幻境online — 主控制器
 *  串联战斗流程、自动战斗循环、导航绑定
 * ============================================================ */

const Main = (() => {
  const E = Engine;
  const D = GameData;
  let inBattle = false;
  let autoTimer = null;

  function init(){
    // 导航
    document.querySelectorAll("#navbar button").forEach(btn=>{
      btn.onclick=()=>{
        if(inBattle){ UI.toast("战斗中无法切换页面"); return; }
        UI.go(btn.dataset.nav);
      };
    });
    UI.renderStart();
  }

  // 进入主游戏(创建或读档后)
  function boot(){
    inBattle=false;
    UI.refreshTop();
    UI.go("quest");
  }

  /* ---------- 战斗流程 ---------- */
  function enterBattle(mapId, isBoss){
    stopAuto();
    const map = D.MAPS.find(m=>m.id===mapId);
    if(isBoss && E.state.hp < E.computeStats().hp*0.5){
      UI.toast("生命值过低，建议先恢复再挑战Boss");
    }
    // 普通刷怪有概率触发随机奇遇
    if(!isBoss && !E.state.autoBattle){
      const ev = E.rollEncounter(mapId);
      if(ev){ UI.showEncounter(ev, mapId); return; }
    }
    E.startBattle(mapId, isBoss);
    inBattle=true;
    UI.renderBattle();
    // 若开着自动战斗，继续自动
    if(E.state.autoBattle) startAuto();
  }

  // 处理奇遇选择
  function resolveEncounter(actionId, mapId){
    const res = E.applyEncounter(actionId);
    if(res.battle && res.battle.elite){
      E.startEliteBattle(mapId);
      inBattle=true;
      UI.renderBattle();
      return;
    }
    UI.showEncounterResult(res, mapId);
  }

  // 精英战(伏击)直接进入
  function startEliteFight(mapId){
    stopAuto();
    E.startEliteBattle(mapId);
    inBattle=true;
    UI.renderBattle();
  }

  // 世界事件战
  function enterEvent(key){
    stopAuto();
    const b=E.startWorldEvent(key);
    if(!b){ UI.toast("无法开始(等级不足或今日已完成)"); return; }
    inBattle=true;
    UI.renderBattle();
  }

  function playerTurn(skillId, targetIndex){
    if(E.battle.over) return;
    const res = E.playerAction(skillId, targetIndex);
    if(res && res.err){ UI.toast(res.err); return; }
    UI.renderBattle();
    if(E.battle.over) onBattleEnd();
  }

  function useBattleItem(id){
    const res=E.useBattleItem(id);
    if(res.err){ UI.toast(res.err); return; }
    UI.renderBattle();
    if(E.battle.over) onBattleEnd();
  }

  function fleeBattle(){
    stopAuto();
    const ok=E.flee();
    UI.renderBattle();
    if(E.battle.over) onBattleEnd();
    else UI.toast("逃跑失败！");
  }

  function onBattleEnd(){
    stopAuto();
    UI.refreshTop();
    // 自动战斗胜利且开启时，普通刷怪自动再来
    if(E.state.autoBattle && E.battle.result==="win" && !E.battle.isBoss){
      const mapId=E.battle.map.id;
      setTimeout(()=>{
        if(E.state.autoBattle && inBattle){
          enterBattle(mapId,false);
        }
      }, 1100);
    }
  }

  function leaveBattle(){
    inBattle=false;
    stopAuto();
    UI.go("map");
  }

  /* ---------- 自动战斗 ---------- */
  function toggleAuto(){
    E.state.autoBattle = !E.state.autoBattle;
    E.save();
    if(E.state.autoBattle){ UI.toast("自动战斗开启","good"); startAuto(); }
    else { UI.toast("自动战斗关闭"); stopAuto(); }
    UI.renderBattle();
  }

  function startAuto(){
    stopAuto();
    autoTimer = setInterval(()=>{
      if(!inBattle || !E.battle || E.battle.over || !E.state.autoBattle){ stopAuto(); return; }
      const action = E.autoChooseAction();
      if(action.type==="item"){ E.useBattleItem(action.id); }
      else if(action.type==="skill"){ E.playerAction(action.id, autoTarget()); }
      else { E.playerAction("attack", autoTarget()); }
      UI.renderBattle();
      if(E.battle.over){ onBattleEnd(); }
    }, 900);
  }
  function autoTarget(){
    const b=E.battle;
    // 优先攻击血量最低的活敌(快速减少敌方数量)
    let idx=-1, min=Infinity;
    b.enemies.forEach((e,i)=>{ if(e.hp>0 && e.hp<min){min=e.hp;idx=i;} });
    return idx<0?0:idx;
  }
  function stopAuto(){ if(autoTimer){ clearInterval(autoTimer); autoTimer=null; } }

  return { init, boot, enterBattle, resolveEncounter, startEliteFight, enterEvent, playerTurn, useBattleItem, fleeBattle,
           leaveBattle, toggleAuto };
})();

window.addEventListener("DOMContentLoaded", Main.init);
