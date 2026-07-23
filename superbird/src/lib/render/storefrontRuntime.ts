// Storefront runtime: cart (localStorage) + add-to-cart, cart page, Stripe
// checkout redirect, order confirmation, and customer login. Wired by
// body[data-sb-system] and data-sb-* markers. Framework-free — into /script.js.
export function storefrontRuntimeScript(): string {
  return `(function(){
  var CART='sb_cart';
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function getCart(){ try{ return JSON.parse(localStorage.getItem(CART)||'{}')||{}; }catch(e){ return {}; } }
  function setCart(c){ localStorage.setItem(CART, JSON.stringify(c)); updateCounts(); }
  function count(c){ var n=0; for(var k in c) n+=c[k]; return n; }
  function updateCounts(){ var n=count(getCart()); var els=document.querySelectorAll('[data-sb-cart-count]'); for(var i=0;i<els.length;i++) els[i].textContent=n; }
  function money(cents,cur){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:(cur||'usd').toUpperCase()}).format(cents/100); }catch(e){ return '$'+(cents/100).toFixed(2); } }

  // Add to cart (delegated) — resolve the product from the nearest data-sb-entry.
  document.addEventListener('click', function(e){
    var t=e.target; if(!t||!t.closest) return;
    var add=t.closest('[data-sb-add-to-cart]');
    if(add){ e.preventDefault();
      var host=add.closest('[data-sb-entry]')||document.querySelector('[data-sb-entry]')||document.body;
      var id=host.getAttribute('data-sb-entry')||add.getAttribute('data-sb-add-to-cart'); if(!id) return;
      var c=getCart(); c[id]=(c[id]||0)+1; setCart(c);
      var old=add.getAttribute('data-sb-label')||add.textContent; add.setAttribute('data-sb-label',old); add.textContent='Added \\u2713';
      setTimeout(function(){ add.textContent=old; }, 1200); return;
    }
    var rm=t.closest('[data-sb-remove]');
    if(rm){ e.preventDefault(); var cc=getCart(); delete cc[rm.getAttribute('data-sb-remove')]; setCart(cc);
      if(document.body.getAttribute('data-sb-system')==='cart') renderCart(); return; }
    var co=t.closest('[data-sb-checkout]');
    if(co){ e.preventDefault(); checkout(co); return; }
  });

  function checkout(btn){
    var c=getCart(), items=Object.keys(c).filter(function(k){return c[k]>0;}).map(function(k){return {entryId:k,qty:c[k]};});
    if(!items.length) return;
    btn.disabled=true; var old=btn.textContent; btn.textContent='Redirecting\\u2026';
    fetch('/api/store/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:items})})
      .then(function(r){ return r.json().catch(function(){return {};}).then(function(j){ return {ok:r.ok,j:j}; }); })
      .then(function(res){ if(res.ok&&res.j.url){ location.href=res.j.url; } else { alert((res.j&&res.j.error)||'Checkout failed.'); btn.disabled=false; btn.textContent=old; } })
      .catch(function(){ alert('Network error. Please try again.'); btn.disabled=false; btn.textContent=old; });
  }

  function renderCart(){
    var c=getCart();
    fetch('/api/store/catalog').then(function(r){return r.json();}).then(function(d){
      var by={}, cur=d.currency||'usd'; (d.products||[]).forEach(function(p){ by[p.entryId]=p; });
      var container=document.querySelector('[data-sb-cart]')||document.querySelector('section')||document.body;
      var prev=container.querySelector('[data-sb-cart-render]'); if(prev) prev.remove();
      var wrap=document.createElement('div'); wrap.setAttribute('data-sb-cart-render','');
      var ids=Object.keys(c).filter(function(k){ return c[k]>0 && by[k]; });
      if(!ids.length){ wrap.innerHTML='<p>Your cart is empty.</p>'; container.appendChild(wrap); return; }
      var total=0, html='<ul style="list-style:none;padding:0;margin:0">';
      ids.forEach(function(k){ var p=by[k], line=p.price*c[k]; total+=line;
        html+='<li style="display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;border-bottom:1px solid rgba(0,0,0,.1)"><span>'+esc(p.title)+' \\u00d7 '+c[k]+'</span><span>'+money(line,cur)+' <a href="#" data-sb-remove="'+esc(k)+'" style="margin-left:.5rem;text-decoration:none">\\u2715</a></span></li>';
      });
      html+='</ul><p style="display:flex;justify-content:space-between;font-weight:600;margin-top:1rem"><span>Total</span><span>'+money(total,cur)+'</span></p><button type="button" data-sb-checkout style="margin-top:1rem;cursor:pointer">Checkout</button>';
      wrap.innerHTML=html; container.appendChild(wrap);
    });
  }

  function renderConfirmation(){
    localStorage.removeItem(CART); updateCounts();
    var sid=new URLSearchParams(location.search).get('session_id'); if(!sid) return;
    fetch('/api/store/order?session_id='+encodeURIComponent(sid)).then(function(r){ return r.ok?r.json():null; }).then(function(d){
      if(!d||!d.order) return; var o=d.order, cur=o.currency;
      var container=document.querySelector('section')||document.body, wrap=document.createElement('div');
      var html='<ul style="list-style:none;padding:0">'; (o.items||[]).forEach(function(it){ html+='<li>'+esc(it.title)+' \\u00d7 '+it.qty+' \\u2014 '+money(it.unitPrice*it.qty,cur)+'</li>'; });
      html+='</ul><p style="font-weight:600">Total: '+money(o.total,cur)+'</p>';
      wrap.innerHTML=html; container.appendChild(wrap);
    });
  }

  function login(){
    var form=document.querySelector('form'); if(!form) return;
    function msg(text,ok){ var el=form.querySelector('[data-sb-msg]'); if(!el){ el=document.createElement('div'); el.setAttribute('data-sb-msg',''); el.style.marginTop='0.75rem'; form.appendChild(el); } el.style.color=ok?'#15803d':'#b91c1c'; el.textContent=text; }
    form.addEventListener('submit',function(e){ e.preventDefault();
      var fd=new FormData(form), d={}; fd.forEach(function(v,k){ d[k]=v; });
      var btn=form.querySelector('[type=submit], button:not([type])'); if(btn) btn.disabled=true;
      fetch('/api/store/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:d.email,password:d.password})})
        .then(function(r){ return r.json().catch(function(){return {};}).then(function(j){ return {ok:r.ok,j:j}; }); })
        .then(function(res){ if(res.ok){ location.href='/account'; } else { msg((res.j&&res.j.error)||'Login failed.',false); if(btn) btn.disabled=false; } })
        .catch(function(){ msg('Network error. Please try again.',false); if(btn) btn.disabled=false; });
    });
  }

  function init(){
    updateCounts();
    var sys=document.body.getAttribute('data-sb-system');
    if(sys==='login') login();
    else if(sys==='cart') renderCart();
    else if(sys==='order-confirmation') renderConfirmation();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();`
}
