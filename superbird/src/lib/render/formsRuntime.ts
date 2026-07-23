// Client runtime for published forms: intercepts <form data-sb-form> submits,
// POSTs the fields as JSON to the public endpoint, and shows an inline result.
// Framework-free — emitted verbatim into the shared /script.js.
export function formsRuntimeScript(): string {
  return `(function(){
  function serialize(form){
    var data={}, fd=new FormData(form);
    fd.forEach(function(v,k){ if(typeof v==='string'){ data[k]=v; } });
    return data;
  }
  function message(form,text,ok){
    var el=form.querySelector('[data-sb-form-msg]');
    if(!el){ el=document.createElement('div'); el.setAttribute('data-sb-form-msg',''); el.style.marginTop='0.75rem'; form.appendChild(el); }
    el.textContent=text; el.style.color=ok?'#15803d':'#b91c1c';
  }
  function onSubmit(e){
    var form=e.currentTarget, id=form.getAttribute('data-sb-form');
    e.preventDefault(); if(!id) return;
    var btn=form.querySelector('[type=submit], button:not([type])');
    if(btn) btn.disabled=true;
    fetch('/api/public/forms',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({formId:id,pageUrl:location.pathname,fields:serialize(form)})})
      .then(function(r){ return r.json().catch(function(){return {};}).then(function(d){ return {ok:r.ok,d:d}; }); })
      .then(function(res){
        if(res.ok){ form.reset(); message(form,(res.d&&res.d.message)||'Thanks!',true); }
        else { message(form,(res.d&&res.d.error)||'Something went wrong.',false); }
      })
      .catch(function(){ message(form,'Network error. Please try again.',false); })
      .then(function(){ if(btn) btn.disabled=false; });
  }
  function init(){
    var forms=document.querySelectorAll('form[data-sb-form]');
    for(var i=0;i<forms.length;i++){ forms[i].addEventListener('submit',onSubmit); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();`
}
