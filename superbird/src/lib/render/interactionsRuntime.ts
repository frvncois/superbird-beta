// The published-site interaction runtime, returned as a vanilla-JS string to
// embed in a <script>. It's a faithful port of src/lib/animations.ts (keyframe
// building via the Web Animations API) plus the trigger switch from
// useInteractionRunner — page-load / click / hover / scroll-into-view /
// scroll-position. Elements carry their interactions as data-sb-ix JSON.
//
// Kept in sync by hand with animations.ts / useInteractionRunner. No template
// interpolation and no `</script>` inside, so it embeds safely.

export function interactionsRuntimeScript(): string {
  return `(function(){
  function ensureUnit(v,u){ if(!v) return '0'+u; if(isNaN(parseFloat(v))) return v; if(/[a-z%]+$/i.test(v)) return v; return v+u; }
  var TRANSFORM=['translateX','translateY','translateZ','scaleX','scaleY','rotateX','rotateY','rotateZ'];
  var FILTER=['blur','brightness','contrast','saturate'];
  function transformVal(p,v){
    if(p==='scaleX') return 'scaleX('+v+')';
    if(p==='scaleY') return 'scaleY('+v+')';
    if(p[0]==='r') return p+'('+ensureUnit(v,'deg')+')';
    return p+'('+ensureUnit(v,'px')+')';
  }
  function filterVal(p,v){ return p==='blur' ? 'blur('+ensureUnit(v,'px')+')' : p+'('+v+')'; }
  function cssProp(p){ return p==='background-color' ? 'backgroundColor' : p; }
  function buildKeyframes(actions){
    var from={},to={},tf=[],tt=[],ff=[],ft=[];
    actions.forEach(function(a){
      if(TRANSFORM.indexOf(a.property)>=0){ tf.push(transformVal(a.property,a.from)); tt.push(transformVal(a.property,a.to)); }
      else if(FILTER.indexOf(a.property)>=0){ ff.push(filterVal(a.property,a.from)); ft.push(filterVal(a.property,a.to)); }
      else { var c=cssProp(a.property); from[c]=a.from; to[c]=a.to; }
    });
    if(tf.length){ from.transform=tf.join(' '); to.transform=tt.join(' '); }
    if(ff.length){ from.filter=ff.join(' '); to.filter=ft.join(' '); }
    return {from:from,to:to};
  }
  function resolveTargets(el,step){
    var t=step.target||{};
    switch(t.type){
      case 'self': return [el];
      case 'children': return Array.prototype.slice.call(el.children);
      case 'child': var f=el.querySelector('*'); return f?[f]:[];
      case 'sibling': return el.parentElement ? Array.prototype.slice.call(el.parentElement.children).filter(function(c){return c!==el;}) : [];
      case 'parent': return el.parentElement?[el.parentElement]:[];
      case 'class': if(!t.value) return []; var s=t.value.charAt(0)==='.'?t.value:'.'+t.value; return Array.prototype.slice.call(document.querySelectorAll(s));
      case 'id': if(!t.value) return []; var id=t.value.charAt(0)==='#'?t.value.slice(1):t.value; var e=document.getElementById(id); return e?[e]:[];
      default: return [el];
    }
  }
  function runStep(el,step,reverse){
    var targets=resolveTargets(el,step);
    if(!targets.length||!step.actions.length) return [];
    var kf=buildKeyframes(step.actions);
    var frames=reverse?[kf.to,kf.from]:[kf.from,kf.to];
    var anims=[];
    targets.forEach(function(target,i){
      var sd=(step.stagger||0)*i;
      anims.push(target.animate(frames,{delay:(step.delay||0)+sd,duration:step.duration||0,easing:step.easing||'ease',fill:'forwards'}));
    });
    return anims;
  }
  function runAll(el,ix,reverse){ var a=[]; (ix.steps||[]).forEach(function(s){ a=a.concat(runStep(el,s,reverse)); }); return a; }
  function attach(el,ix){
    if(!ix.steps||!ix.steps.length) return;
    var active=[]; var opts=ix.options||{};
    function cancel(){ active.forEach(function(a){ try{a.cancel();}catch(e){} }); active=[]; }
    switch(ix.trigger){
      case 'page-load':
        active=runAll(el,ix,false);
        if(opts.loop){ var total=Math.max.apply(null,ix.steps.map(function(s){return (s.delay||0)+(s.duration||0);})); setInterval(function(){cancel();active=runAll(el,ix,false);}, total+100); }
        break;
      case 'click':
        var toggled=false;
        el.addEventListener('click',function(){ cancel(); active=runAll(el,ix,toggled); toggled=!toggled; });
        break;
      case 'hover':
        el.addEventListener('mouseenter',function(){ cancel(); active=runAll(el,ix,false); });
        el.addEventListener('mouseleave',function(){ if(opts.resetOnExit){ cancel(); active=runAll(el,ix,true); } });
        break;
      case 'scroll-into-view':
        var obs=new IntersectionObserver(function(entries){ entries.forEach(function(en){
          if(en.isIntersecting){ cancel(); active=runAll(el,ix,false); }
          else if(opts.resetOnExit){ cancel(); active=runAll(el,ix,true); }
        }); },{threshold:0.1});
        obs.observe(el);
        break;
      case 'scroll-position':
        var anims=runAll(el,ix,false); anims.forEach(function(a){a.pause();});
        var onScroll=function(){
          var rect=el.getBoundingClientRect(); var vh=window.innerHeight||1;
          var progress=Math.max(0,Math.min(1,1-(rect.top/vh)));
          anims.forEach(function(a){ if(a.effect){ var d=(a.effect.getComputedTiming().duration)||300; a.currentTime=progress*d; } });
        };
        window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
        break;
    }
  }
  function init(){
    var els=document.querySelectorAll('[data-sb-ix]');
    Array.prototype.forEach.call(els,function(el){
      var list; try{ list=JSON.parse(el.getAttribute('data-sb-ix')); }catch(e){ return; }
      if(list && list.length){ list.forEach(function(ix){ attach(el,ix); }); }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();`
}
