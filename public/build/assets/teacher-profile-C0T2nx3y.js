import{i as e,t}from"./jsx-runtime-DUAcabCT.js";import{f as n,i as r,l as i,o as a,p as o,r as ee,t as s}from"./createLucideIcon-Dvk3L-GP.js";import{t as te}from"./award-B1-9mIhZ.js";import{t as ne}from"./circle-alert-BfBI0RbZ.js";import{t as re}from"./circle-check-BSp-weCv.js";import{t as ie}from"./CertificatePreviewModal-CuZa3HXS.js";import{t as ae}from"./eye-C2_8ElLZ.js";import{t as c}from"./file-text-0Ex1uYyO.js";import{t as oe}from"./info-BuptbC8q.js";import{t as se}from"./loader-circle-BEvPHnSY.js";import{t as ce}from"./mail-Cyjf6aEk.js";import{t as le}from"./maximize-2-DRT6Kb4d.js";import{a as ue,i as l,n as u,o as d,r as de,t as f}from"./duration-BVxjdmc4.js";import{t as fe}from"./phone-Ci2t-nc_.js";import{t as pe}from"./send-ByaXf12l.js";import{t as me}from"./shield-check-CQFn5MFt.js";import{t as he}from"./sparkles-CywokAiU.js";import{t as ge}from"./star-D3kqWao7.js";import{t as _e}from"./trash-2-BteG9-0Q.js";import{t as ve}from"./user-Ch2RxVdp.js";import{A as ye,B as be,J as p,U as xe,W as Se,j as Ce,k as m,u as we}from"./app-D9PTOdGl.js";import{t as Te}from"./axios-DpK34-Cd.js";import{t as Ee}from"./delete-user-modal-Cbd5TZfS.js";import{t as De}from"./ShareProfileDropdown-DJMdXD_S.js";import{i as Oe,r as ke,t as Ae}from"./certificates-CKr_xkxu.js";import{t as je}from"./PaymentModal-BuESMrIf.js";var Me=s(`MessageCircle`,[[`path`,{d:`M7.9 20A9 9 0 1 0 4 16.1L2 22Z`,key:`vv11sd`}]]),h=e(n(),1),g=t();function _({teacher:e,hasEligibleTrial:t=!0,trialPrice:n,conversationStats:s,packages:_=[],activePupilPackage:v=null,activePupilPackages:y=[],totalActivePackageMinutes:Ne,pendingPupilPackage:b=null}){let{auth:x}=i().props,{t:S,locale:C}=we(),w=Ne??(y&&y.length>0?y.reduce((e,t)=>e+(t.remaining_minutes||0),0):v?.remaining_minutes??0),[T,E]=h.useState(w>0?`full`:t?`trial`:`full`),[D,Pe]=h.useState(null),[O,Fe]=h.useState(60),[Ie,k]=h.useState(null),[A,j]=h.useState(null),[M,Le]=h.useState(!1),[N,P]=h.useState(null),F=e.teacher_profile?.certificates??[],I=h.useMemo(()=>{if(!F)return[];let e=typeof F==`string`?JSON.parse(F):F;return(Array.isArray(e)?e:[]).map(e=>{if(typeof e==`string`){let t=e.startsWith(`http`)||e.startsWith(`/storage`);return{type:`ielts`,language:`english`,custom_type_name:``,custom_language:``,title:t?`IELTS Certificate`:e,overall:``,listening:``,reading:``,writing:``,speaking:``,sub_scores:{},file_url:t?e:null,file_name:t?e.substring(e.lastIndexOf(`/`)+1):``,status:`verified`}}let t=e.type??`ielts`,n=e.language??(Oe(t)||`english`),r=e.custom_type_name??``,i=ke(t),a=e=>e?/\.(jpg|jpeg|png|pdf|webp|svg|gif)$/i.test(e)||/^IMG_/i.test(e)||e.includes(`/`):!0,o=e.title||``;return(!o||a(o))&&(o=t===`other`&&r&&!a(r)?r:i.label),{type:t,language:n,custom_type_name:r,custom_language:e.custom_language??``,title:o,overall:e.overall??``,listening:e.listening??``,reading:e.reading??``,writing:e.writing??``,speaking:e.speaking??``,sub_scores:e.sub_scores&&typeof e.sub_scores==`object`?e.sub_scores:{},file_url:e.file_url??null,file_name:e.file_name??``,status:e.status??`pending`}})},[F]);h.useEffect(()=>{a({breadcrumbs:[{title:`find teachers`,href:`/pupil/teachers`},{title:e.full_name,href:`/pupil/teachers/${e.id}`}]})},[e.full_name,e.id]);let Re=e.full_name.split(` `).map(e=>e[0]).join(``).toUpperCase(),ze=h.useMemo(()=>{let e=[],t=new Date;for(let n=0;n<7;n++){let r=new Date;r.setDate(t.getDate()+n),e.push(r)}return e},[]),[L,Be]=h.useState(ze[0]),[Ve,He]=h.useState([]),[Ue,We]=h.useState(!1),[R,z]=h.useState(null),[B,V]=h.useState(null),[H,Ge]=h.useState(!1),[U,Ke]=h.useState(``),[qe,W]=h.useState(``),[G,Je]=h.useState([]),[K,Ye]=h.useState(!1),[Xe,Ze]=h.useState(``),[Qe,$e]=h.useState(!1),et=e=>`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`,q=e=>`${String(e.getHours()).padStart(2,`0`)}:${String(e.getMinutes()).padStart(2,`0`)}`,tt=async()=>{We(!0);try{let t=et(L),n=await Te.get(`/bookings/slots/${e.id}?date=${t}`);He(Array.isArray(n.data)?n.data:n.data.slots||[]),z(null)}catch{p.error(`Failed to load slots`)}finally{We(!1)}};h.useEffect(()=>(tt(),window.Echo.channel(`teacher.${e.id}`).listen(`.booking.updated`,()=>{tt()}),()=>{window.Echo.leaveChannel(`teacher.${e.id}`)}),[L,e.id]),h.useEffect(()=>{if(B){let e=new Date(B.start_at),t=new Date(B.end_at);Ke(q(e));let n=new Date(e.getTime()+1800*1e3);n.getTime()>t.getTime()?W(q(t)):W(q(n)),Je([]),Ye(!1),Ze(``)}},[B]);let nt=()=>{if(!B)return null;let e=new Date(B.start_at),[t,n]=U.split(`:`).map(Number),r=new Date(e.getFullYear(),e.getMonth(),e.getDate(),t,n),[i,a]=qe.split(`:`).map(Number);return{start:r,end:new Date(e.getFullYear(),e.getMonth(),e.getDate(),i,a)}},J=()=>{if(!B||!B.is_all_time)return!0;let e=nt();if(!e)return!1;let t=new Date(B.start_at),n=new Date(B.end_at);return e.start.getTime()>=t.getTime()&&e.start.getTime()<n.getTime()&&e.end.getTime()>e.start.getTime()&&e.end.getTime()<=n.getTime()},rt=()=>{let e=[...G];return K&&Xe.trim()&&e.push(Xe.trim()),e},it=async()=>{if(!B)return;let t=rt();if(t.length===0){p.error(S(`booking.topics_required`)||`Please select at least one topic`);return}let n=B.start_at,r=B.end_at;if(B.is_all_time){let e=nt();if(!e||!J()){p.error(S(`booking.invalid_range`)||`Selected range is invalid`);return}n=e.start.toISOString(),r=e.end.toISOString()}else{let e=T===`trial`?20:O,t=new Date(B.start_at),i=new Date(t.getTime()+e*6e4);n=t.toISOString(),r=i.toISOString()}Ge(!0);try{await Te.post(`/bookings`,{teacher_id:e.id,pupil_id:x.user.id,start_at:n,end_at:r,topics:t,is_trial:T===`trial`,duration_minutes:T===`trial`?20:O}),p.success(S(`booking.success`)||`Appointment booked successfully!`),V(null),tt()}catch(e){let t=e.response?.data?.errors,n=t?Object.values(t).flat()[0]:null,r=e.response?.data?.message||n||S(`booking.failed`)||`Booking failed`;p.error(r)}finally{Ge(!1)}},Y=Number(e.teacher_profile?.price??0),at=Y>0?`${Y.toLocaleString(`ru-RU`).replace(/,/g,` `)} so'm`:`0 so'm`,ot=n&&n>0?n:Y>0?Math.round(Y/3/1e3)*1e3:0,st=ot>0?`${ot.toLocaleString(`ru-RU`).replace(/,/g,` `)} so'm`:`0 so'm`,X=T===`trial`?20:O,Z=T!==`trial`&&w>=X,ct=T!==`trial`&&w>0&&w<X,Q=Z?0:Y>0?Math.round(Y*O/60):0,lt=Z?`0 so'm`:Q>0?`${Q.toLocaleString(`ru-RU`).replace(/,/g,` `)} so'm`:`0 so'm`,$=T===`trial`?ot:Q,ut=Z?`0 so'm`:$>0?`${$.toLocaleString(`ru-RU`).replace(/,/g,` `)} so'm`:`0 so'm`,dt=()=>{if(!A)return;if(!x?.user){o.visit(`/login`);return}if(x.user.role!==`pupil`){p.error(`Only students can purchase conversation packs.`);return}let t=A;Le(!0),o.post(`/pupil/packages/purchase`,{teacher_package_id:A.id},{preserveScroll:!0,onSuccess:()=>{j(null),P({title:t.title,price:t.price,teacherName:e.full_name}),p.success(S(`packages.purchase_success`)||`Package purchase request submitted! Admin will verify payment shortly.`)},onError:e=>{let t=e?.message||(typeof e==`object`?Object.values(e)[0]:null)||`Failed to submit purchase.`;p.error(typeof t==`string`?t:`Failed to submit purchase.`)},onFinish:()=>{Le(!1)}})},ft=e.gender===`male`?`his`:e.gender===`female`?`her`:`their`;return(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(ee,{title:`${e.full_name} — Teacher · ConvoMate`}),(0,g.jsxs)(`div`,{className:`teacher-profile-pupil-container min-h-screen px-4 py-8 md:px-8`,children:[(0,g.jsx)(`style`,{dangerouslySetInnerHTML:{__html:`
                    .teacher-profile-pupil-container {
                        --butter: #F7DE8B;
                        --butter-deep: #F0CE5F;
                        --blue: #A9C6E8;
                        --blue-tint: #EEF4FB;
                        --navy: #1E2A5A;
                        --ink: #22284A;
                        --muted: #6B7394;
                        --line: #E6E9F2;
                        --radius: 22px;
                    }
                    .teacher-profile-pupil-container h1,
                    .teacher-profile-pupil-container h2,
                    .teacher-profile-pupil-container h3,
                    .teacher-profile-pupil-container .bricolage-font {
                        font-family: 'Bricolage Grotesque', sans-serif !important;
                    }
                    .teacher-profile-pupil-container p,
                    .teacher-profile-pupil-container label,
                    .teacher-profile-pupil-container input,
                    .teacher-profile-pupil-container textarea,
                    .teacher-profile-pupil-container select,
                    .teacher-profile-pupil-container span,
                    .teacher-profile-pupil-container button,
                    .teacher-profile-pupil-container div,
                    .teacher-profile-pupil-container aside {
                        font-family: 'Schibsted Grotesk', sans-serif !important;
                    }

                    .teacher-profile-pupil-container {
                        color: var(--ink);
                        background: #FAFBFD;
                        line-height: 1.55;
                        width: 100%;
                    }
                    .teacher-profile-pupil-container .crumb{font-size:13px;color:var(--muted);margin-bottom:16px}
                    .teacher-profile-pupil-container .crumb a{color:var(--muted);text-decoration:none}
                    .teacher-profile-pupil-container .crumb a:hover{color:var(--navy)}

                    .teacher-profile-pupil-container .head-card{
                        background:#fff;border:1px solid var(--line);border-radius:var(--radius);
                        padding:28px;display:flex;gap:24px;align-items:center;position:relative;overflow:hidden;margin-bottom:24px;
                    }
                    .teacher-profile-pupil-container .naqsh{position:absolute;top:14px;right:14px;width:66px;height:66px;opacity:.4;pointer-events:none}
                    .teacher-profile-pupil-container .avatar{
                        width:110px;height:110px;border-radius:26px;flex-shrink:0;
                        background:linear-gradient(135deg,var(--navy),#2E3D7A);
                        display:flex;align-items:center;justify-content:center;
                        font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:38px;color:#fff;
                    }
                    .teacher-profile-pupil-container .avatar-img {
                        width: 110px;
                        height: 110px;
                        border-radius: 26px;
                        flex-shrink: 0;
                        object-fit: cover;
                    }
                    .teacher-profile-pupil-container .head-main{flex:1;min-width:0}
                    .teacher-profile-pupil-container .name-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
                    .teacher-profile-pupil-container .name{font-size:30px;font-weight:800;letter-spacing:-0.7px;color:var(--navy);line-height:1.1}
                    .teacher-profile-pupil-container .verified{
                        display:inline-flex;align-items:center;gap:6px;background:var(--navy);color:#fff;
                        font-size:11.5px;font-weight:700;padding:5px 12px;border-radius:999px;
                    }
                    .teacher-profile-pupil-container .verified svg{width:11px;height:11px}
                    .teacher-profile-pupil-container .headline{font-size:15.5px;color:var(--ink);margin-top:6px;max-width:56ch}
                    .teacher-profile-pupil-container .head-meta{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center}
                    .teacher-profile-pupil-container .score-chip{
                        display:flex;align-items:baseline;gap:7px;border-radius:14px;padding:8px 14px;
                        border:1px solid var(--line);background:#fff;
                    }
                    .teacher-profile-pupil-container .score-chip.hero{background:var(--butter);border-color:var(--butter)}
                    .teacher-profile-pupil-container .score-chip .sv{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:18px;color:var(--navy)}
                    .teacher-profile-pupil-container .score-chip .sl{font-size:12px;font-weight:600;color:var(--muted)}
                    .teacher-profile-pupil-container .score-chip.hero .sl{color:#7A6520}
                    .teacher-profile-pupil-container .new-badge{
                        display:inline-flex;align-items:center;gap:7px;
                        background:var(--blue-tint);border:1px solid #D8E5F5;border-radius:999px;
                        padding:8px 14px;font-size:12.5px;font-weight:600;color:var(--navy);
                    }
                    .teacher-profile-pupil-container .new-badge .spark{color:var(--butter-deep)}
                    @media(max-width:700px){
                        .teacher-profile-pupil-container .head-card{flex-direction:column;align-items:flex-start}
                        .teacher-profile-pupil-container .avatar{width:84px;height:84px;font-size:28px;border-radius:20px}
                        .teacher-profile-pupil-container .avatar-img{width:84px;height:84px;border-radius:20px}
                    }

                    .teacher-profile-pupil-container .body-grid{display:grid;grid-template-columns:1fr 330px;gap:24px;align-items:start}
                    @media(max-width:880px){.teacher-profile-pupil-container .body-grid{grid-template-columns:1fr}}

                    .teacher-profile-pupil-container .main-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}
                    .teacher-profile-pupil-container .section{padding:26px 28px;border-bottom:1px solid var(--line)}
                    .teacher-profile-pupil-container .section:last-child{border-bottom:none}
                    .teacher-profile-pupil-container .sec-title{
                        display:flex;align-items:center;gap:10px;
                        font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:700;
                        color:var(--navy);letter-spacing:-0.2px;margin-bottom:16px;
                    }
                    .teacher-profile-pupil-container .sec-title .n{
                        width:26px;height:26px;border-radius:9px;background:var(--blue-tint);
                        display:flex;align-items:center;justify-content:center;flex-shrink:0;
                    }
                    .teacher-profile-pupil-container .sec-title .n svg{width:14px;height:14px;stroke:var(--navy)}

                    .teacher-profile-pupil-container .intro{
                        border-radius:16px;overflow:hidden;position:relative;background:var(--navy);
                        aspect-ratio:16/7.5;display:flex;align-items:center;justify-content:center;cursor:pointer;
                        width:100%;
                    }
                    .teacher-profile-pupil-container .intro .glow{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 20%, rgba(169,198,232,.28), transparent 55%),radial-gradient(ellipse at 80% 90%, rgba(247,222,139,.18), transparent 50%)}
                    .teacher-profile-pupil-container .play{width:56px;height:56px;border-radius:50%;background:var(--butter);display:flex;align-items:center;justify-content:center;z-index:2;transition:transform .2s;box-shadow:0 8px 24px rgba(0,0,0,.25)}
                    .teacher-profile-pupil-container .intro:hover .play{transform:scale(1.07)}
                    .teacher-profile-pupil-container .play svg{width:18px;height:18px;fill:var(--navy);margin-left:2px}
                    .teacher-profile-pupil-container .intro .tag{position:absolute;left:16px;bottom:13px;z-index:2;color:#fff;font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:7px}
                    .teacher-profile-pupil-container .intro .tag .rec{width:7px;height:7px;border-radius:50%;background:var(--butter)}
                    .teacher-profile-pupil-container .intro .dur{position:absolute;right:16px;bottom:13px;z-index:2;color:rgba(255,255,255,.75);font-size:12px}

                    .teacher-profile-pupil-container .bio{font-size:14.5px;color:var(--ink);max-width:62ch;white-space:pre-wrap}
                    .teacher-profile-pupil-container .bio+.bio{margin-top:9px}
                    .teacher-profile-pupil-container .chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
                    .teacher-profile-pupil-container .chip{background:var(--blue-tint);color:var(--navy);border:1px solid #D8E5F5;font-size:13px;font-weight:600;padding:7px 14px;border-radius:999px}

                    .teacher-profile-pupil-container .cert{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px dashed var(--line)}
                    .teacher-profile-pupil-container .cert:first-of-type{padding-top:0}
                    .teacher-profile-pupil-container .cert:last-of-type{border-bottom:none;padding-bottom:0}
                    .teacher-profile-pupil-container .cert-ic{width:38px;height:38px;border-radius:12px;background:var(--blue-tint);display:flex;align-items:center;justify-content:center;flex-shrink:0}
                    .teacher-profile-pupil-container .cert-ic svg{width:16px;height:16px;stroke:var(--navy)}
                    .teacher-profile-pupil-container .cert-body{flex:1;min-width:0}
                    .teacher-profile-pupil-container .cert-name{font-weight:700;font-size:14px}
                    .teacher-profile-pupil-container .cert-sub{font-size:12px;color:var(--muted)}
                    .teacher-profile-pupil-container .cert-badge{font-size:11px;font-weight:700;color:var(--navy);background:var(--butter);padding:4px 11px;border-radius:999px;white-space:nowrap}
                    .teacher-profile-pupil-container .cert-badge.review{background:var(--line);color:var(--muted)}

                    .teacher-profile-pupil-container .fb-empty{
                        border:1.5px dashed var(--blue);border-radius:16px;background:var(--blue-tint);
                        padding:24px;text-align:center;
                    }
                    .teacher-profile-pupil-container .fb-empty .big{font-family:'Bricolage Grotesque',sans-serif;font-size:16.5px;font-weight:700;color:var(--navy)}
                    .teacher-profile-pupil-container .fb-empty p{font-size:13.5px;color:var(--muted);margin-top:5px;max-width:42ch;margin-left:auto;margin-right:auto}

                    .teacher-profile-pupil-container .book{
                        position:sticky;top:24px;
                        background:#fff;border:1px solid var(--line);border-radius:var(--radius);
                        padding:24px;box-shadow:0 12px 40px rgba(30,42,90,.07);overflow:hidden;
                    }
                    .teacher-profile-pupil-container .book .corner{position:absolute;top:-1px;right:-1px;width:58px;height:58px;opacity:.5;pointer-events:none}
                    .teacher-profile-pupil-container .price-row{display:flex;align-items:baseline;gap:8px}
                    .teacher-profile-pupil-container .price{font-family:'Bricolage Grotesque',sans-serif;font-size:29px;font-weight:800;color:var(--navy);letter-spacing:-0.5px}
                    .teacher-profile-pupil-container .per{font-size:13px;color:var(--muted);font-weight:500}
                    .teacher-profile-pupil-container .ltype{
                        border:1.5px solid var(--line);border-radius:16px;padding:14px 16px;cursor:pointer;margin-bottom:12px;position:relative;background:#fff;transition:all .15s;
                    }
                    .teacher-profile-pupil-container .ltype.trial{background:#FFF9E5;border-color:var(--butter-deep)}
                    .teacher-profile-pupil-container .ltype.sel{border-color:var(--navy);box-shadow:0 0 0 1px var(--navy)}
                    .teacher-profile-pupil-container .durs{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
                    .teacher-profile-pupil-container .dur{border:1.5px solid var(--line);border-radius:999px;padding:6px 13px;font-size:12.5px;font-weight:600;color:var(--ink);cursor:pointer;background:#fff;transition:all .15s}
                    .teacher-profile-pupil-container .dur.sel{background:var(--navy);border-color:var(--navy);color:#fff}
                    .teacher-profile-pupil-container .rail-label{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:20px 0 9px}
                    .teacher-profile-pupil-container .day-tabs{display:flex;gap:6px}
                    .teacher-profile-pupil-container .day-tab{
                        flex:1;text-align:center;border:1px solid var(--line);border-radius:12px;padding:8px 4px;
                        cursor:pointer;background:#fff;transition:all .15s;
                    }
                    .teacher-profile-pupil-container .day-tab .dn{font-size:10.5px;color:var(--muted);font-weight:700;letter-spacing:.03em;text-transform:uppercase}
                    .teacher-profile-pupil-container .day-tab .dd{font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700;color:var(--ink)}
                    .teacher-profile-pupil-container .day-tab.active{background:var(--navy);border-color:var(--navy)}
                    .teacher-profile-pupil-container .day-tab.active .dn{color:var(--blue)}
                    .teacher-profile-pupil-container .day-tab.active .dd{color:#fff}
                    .teacher-profile-pupil-container .slots{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
                    .teacher-profile-pupil-container .slot{
                        border:1px solid var(--line);border-radius:999px;padding:7px 14px;font-size:13px;
                        font-weight:600;color:var(--ink);cursor:pointer;background:#fff;transition:all .15s;font-family:inherit;
                    }
                    .teacher-profile-pupil-container .slot:hover{border-color:var(--navy)}
                    .teacher-profile-pupil-container .slot.picked{background:var(--butter);border-color:var(--butter);color:var(--navy)}
                    .teacher-profile-pupil-container .cta{
                        display:block;width:100%;margin-top:20px;border:none;cursor:pointer;
                        background:var(--butter);color:var(--navy);
                        font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:15.5px;
                        padding:15px;border-radius:999px;transition:all .15s;letter-spacing:-0.2px;
                    }
                    .teacher-profile-pupil-container .cta:hover{background:var(--butter-deep);transform:translateY(-1px)}
                    .teacher-profile-pupil-container .cta:disabled{opacity:0.6;cursor:not-allowed}
                    .teacher-profile-pupil-container .book-meta{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
                    .teacher-profile-pupil-container .bm-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0}
                    .teacher-profile-pupil-container .bm-row .k{color:var(--muted)}
                    .teacher-profile-pupil-container .bm-row .v{font-weight:600;color:var(--ink)}
                    .teacher-profile-pupil-container .assure{margin-top:14px;font-size:12px;color:var(--muted);text-align:center;line-height:1.5}
                    .teacher-profile-pupil-container .assure b{color:var(--navy)}
                    .teacher-profile-pupil-container .tz{font-size:11.5px;color:var(--muted);margin-top:10px}

                    /* ── Dark Mode Overrides ─────────────────────────────────────── */
                    .dark .teacher-profile-pupil-container {
                        --butter: #F7DE8B;
                        --butter-deep: #F0CE5F;
                        --blue: #93b5d8;
                        --blue-tint: rgba(147, 181, 216, 0.12);
                        --navy: #f8fafc;
                        --ink: #f1f5f9;
                        --muted: #94a3b8;
                        --line: rgba(255, 255, 255, 0.08);
                        background: transparent !important;
                        color: var(--ink);
                    }

                    .dark .teacher-profile-pupil-container .crumb {
                        color: #94a3b8;
                    }
                    .dark .teacher-profile-pupil-container .crumb a {
                        color: #94a3b8;
                    }
                    .dark .teacher-profile-pupil-container .crumb a:hover {
                        color: #fae18e;
                    }

                    .dark .teacher-profile-pupil-container .head-card,
                    .dark .teacher-profile-pupil-container .main-card,
                    .dark .teacher-profile-pupil-container .book {
                        background: #0d1b3e !important;
                        border-color: rgba(255, 255, 255, 0.08) !important;
                        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
                    }

                    .dark .teacher-profile-pupil-container .naqsh {
                        stroke: #93b5d8;
                        opacity: 0.18;
                    }

                    .dark .teacher-profile-pupil-container .avatar {
                        background: linear-gradient(135deg, #13244e, #1e3a7a);
                        border: 1px solid rgba(255, 255, 255, 0.12);
                    }

                    .dark .teacher-profile-pupil-container .verified {
                        background: #fae18e;
                        color: #061445;
                    }

                    .dark .teacher-profile-pupil-container .headline {
                        color: #cbd5e1;
                    }

                    .dark .teacher-profile-pupil-container .score-chip {
                        background: #091228 !important;
                        border-color: rgba(255, 255, 255, 0.08) !important;
                    }
                    .dark .teacher-profile-pupil-container .score-chip.hero {
                        background: var(--butter) !important;
                        border-color: var(--butter) !important;
                    }
                    .dark .teacher-profile-pupil-container .score-chip.hero .sv {
                        color: #061445 !important;
                    }
                    .dark .teacher-profile-pupil-container .score-chip.hero .sl {
                        color: #53430f !important;
                    }
                    .dark .teacher-profile-pupil-container .score-chip .sv {
                        color: #f8fafc !important;
                    }
                    .dark .teacher-profile-pupil-container .score-chip .sl {
                        color: #94a3b8 !important;
                    }

                    .dark .teacher-profile-pupil-container .new-badge {
                        background: rgba(147, 181, 216, 0.12) !important;
                        border-color: rgba(147, 181, 216, 0.2) !important;
                        color: #93b5d8 !important;
                    }

                    .dark .teacher-profile-pupil-container .section {
                        border-color: rgba(255, 255, 255, 0.08) !important;
                    }

                    .dark .teacher-profile-pupil-container .sec-title {
                        color: #f8fafc !important;
                    }
                    .dark .teacher-profile-pupil-container .sec-title .n {
                        background: rgba(147, 181, 216, 0.12) !important;
                    }
                    .dark .teacher-profile-pupil-container .sec-title .n svg {
                        stroke: #fae18e !important;
                    }

                    .dark .teacher-profile-pupil-container .intro {
                        background: #091228 !important;
                        border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    }
                    .dark .teacher-profile-pupil-container .play svg {
                        fill: #061445;
                    }

                    .dark .teacher-profile-pupil-container .bio {
                        color: #cbd5e1;
                    }

                    .dark .teacher-profile-pupil-container .chip {
                        background: rgba(147, 181, 216, 0.1) !important;
                        border-color: rgba(147, 181, 216, 0.2) !important;
                        color: #cbd5e1 !important;
                    }

                    .dark .teacher-profile-pupil-container .cert {
                        border-color: rgba(255, 255, 255, 0.08) !important;
                    }
                    .dark .teacher-profile-pupil-container .cert-ic {
                        background: rgba(147, 181, 216, 0.12) !important;
                    }
                    .dark .teacher-profile-pupil-container .cert-ic svg {
                        stroke: #fae18e !important;
                    }
                    .dark .teacher-profile-pupil-container .cert-badge.review {
                        background: rgba(255, 255, 255, 0.08) !important;
                        color: #94a3b8 !important;
                    }

                    .dark .teacher-profile-pupil-container .fb-empty {
                        background: rgba(147, 181, 216, 0.05) !important;
                        border-color: rgba(147, 181, 216, 0.25) !important;
                    }
                    .dark .teacher-profile-pupil-container .fb-empty .big {
                        color: #f8fafc !important;
                    }
                    .dark .teacher-profile-pupil-container .fb-empty p {
                        color: #94a3b8 !important;
                    }

                    .dark .teacher-profile-pupil-container .book .corner {
                        stroke: #fae18e !important;
                        opacity: 0.2 !important;
                    }
                    .dark .teacher-profile-pupil-container .price {
                        color: #f8fafc !important;
                    }
                    .dark .teacher-profile-pupil-container .per {
                        color: #94a3b8 !important;
                    }
                    .dark .teacher-profile-pupil-container .rail-label {
                        color: #94a3b8 !important;
                    }

                    .dark .teacher-profile-pupil-container .ltype {
                        background: #091228 !important;
                        border-color: rgba(255, 255, 255, 0.08) !important;
                    }
                    .dark .teacher-profile-pupil-container .ltype.trial {
                        background: rgba(247, 222, 139, 0.06) !important;
                        border-color: rgba(240, 206, 95, 0.35) !important;
                    }
                    .dark .teacher-profile-pupil-container .ltype.sel {
                        border-color: #fae18e !important;
                        box-shadow: 0 0 0 1px #fae18e !important;
                    }

                    .dark .teacher-profile-pupil-container .dur {
                        background: #091228 !important;
                        border-color: rgba(255, 255, 255, 0.08) !important;
                        color: #cbd5e1 !important;
                    }
                    .dark .teacher-profile-pupil-container .dur:hover {
                        border-color: #93b5d8 !important;
                        color: #f8fafc !important;
                    }
                    .dark .teacher-profile-pupil-container .dur.sel {
                        background: #fae18e !important;
                        border-color: #fae18e !important;
                        color: #061445 !important;
                    }

                    .dark .teacher-profile-pupil-container .day-tab {
                        background: #091228 !important;
                        border-color: rgba(255, 255, 255, 0.08) !important;
                    }
                    .dark .teacher-profile-pupil-container .day-tab .dn {
                        color: #94a3b8 !important;
                    }
                    .dark .teacher-profile-pupil-container .day-tab .dd {
                        color: #f8fafc !important;
                    }
                    .dark .teacher-profile-pupil-container .day-tab.active {
                        background: #14234b !important;
                        border-color: #fae18e !important;
                    }
                    .dark .teacher-profile-pupil-container .day-tab.active .dn {
                        color: #fae18e !important;
                    }
                    .dark .teacher-profile-pupil-container .day-tab.active .dd {
                        color: #f8fafc !important;
                    }

                    .dark .teacher-profile-pupil-container .slots {
                        display: flex; gap: 7px; flex-wrap: wrap; margin-top: 10px;
                    }
                    .dark .teacher-profile-pupil-container .slot {
                        background: #091228 !important;
                        border-color: rgba(255, 255, 255, 0.08) !important;
                        color: #cbd5e1 !important;
                    }
                    .dark .teacher-profile-pupil-container .slot:hover {
                        border-color: #fae18e !important;
                        color: #f8fafc !important;
                    }
                    .dark .teacher-profile-pupil-container .slot.picked {
                        background: #fae18e !important;
                        border-color: #fae18e !important;
                        color: #061445 !important;
                    }

                    .dark .teacher-profile-pupil-container .cta {
                        background: #fae18e !important;
                        color: #061445 !important;
                    }
                    .dark .teacher-profile-pupil-container .cta:hover {
                        background: #f0d070 !important;
                    }

                    .dark .teacher-profile-pupil-container .book-meta {
                        border-color: rgba(255, 255, 255, 0.08) !important;
                    }
                    .dark .teacher-profile-pupil-container .bm-row .k {
                        color: #94a3b8 !important;
                    }
                    .dark .teacher-profile-pupil-container .bm-row .v {
                        color: #f8fafc !important;
                    }

                    .dark .teacher-profile-pupil-container .assure {
                        color: #94a3b8 !important;
                    }
                    .dark .teacher-profile-pupil-container .assure b {
                        color: #f8fafc !important;
                    }
                    .dark .teacher-profile-pupil-container .tz {
                        color: #94a3b8 !important;
                    }
                `}}),(0,g.jsxs)(`div`,{className:`crumb`,children:[(0,g.jsx)(r,{href:`/pupil/teachers`,children:`Find Teachers`}),` /`,` `,e.full_name]}),(0,g.jsxs)(`div`,{className:`head-card shadow-sm`,children:[(0,g.jsxs)(`svg`,{className:`naqsh`,viewBox:`0 0 80 80`,fill:`none`,stroke:`#A9C6E8`,"stroke-width":`1.1`,children:[(0,g.jsx)(`path`,{d:`M40 6 L52 28 L74 40 L52 52 L40 74 L28 52 L6 40 L28 28 Z`}),(0,g.jsx)(`path`,{d:`M40 20 L47 33 L60 40 L47 47 L40 60 L33 47 L20 40 L33 33 Z`}),(0,g.jsx)(`circle`,{cx:`40`,cy:`40`,r:`5`})]}),e.avatar?(0,g.jsx)(`img`,{src:e.avatar,alt:e.full_name,className:`avatar-img shadow`}):(0,g.jsx)(`div`,{className:`avatar shadow-lg`,children:Re}),(0,g.jsxs)(`div`,{className:`head-main`,children:[(0,g.jsxs)(`div`,{className:`name-row`,children:[(0,g.jsx)(`h1`,{className:`name`,children:e.full_name}),e.teacher_profile?.is_verified&&(0,g.jsxs)(`span`,{className:`verified`,children:[(0,g.jsx)(xe,{className:`h-3 w-3 stroke-[3]`}),` `,`Verified by ConvoMate`]})]}),(0,g.jsx)(`div`,{className:`mt-2 flex items-center gap-2`,children:(0,g.jsx)(De,{profileId:e.id,name:e.full_name,size:`default`})}),x?.user?.role===`admin`&&(0,g.jsxs)(`div`,{className:`my-4 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/80 p-4 shadow-sm dark:border-indigo-800/60 dark:from-indigo-950/70 dark:via-gray-900 dark:to-blue-950/50`,children:[(0,g.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3 dark:border-indigo-900/50`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,g.jsx)(`div`,{className:`flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs`,children:(0,g.jsx)(me,{className:`h-5 w-5`})}),(0,g.jsxs)(`div`,{children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,g.jsx)(`h3`,{className:`text-sm font-bold text-indigo-950 dark:text-indigo-100`,children:`Admin Teacher Dossier`}),(0,g.jsxs)(`span`,{className:`rounded-md border border-indigo-200 bg-indigo-100/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200`,children:[`ID: `,e.id]})]}),(0,g.jsx)(`p`,{className:`text-[11px] text-gray-500 dark:text-gray-400`,children:`Privileged administrative view with full contact details & account records`})]})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,g.jsx)(m,{size:`sm`,variant:e.teacher_profile?.is_verified?`outline`:`default`,onClick:()=>{o.post(`/admin/teachers/${e.id}/verify`,{verified:!e.teacher_profile?.is_verified})},className:e.teacher_profile?.is_verified?`h-8 border-indigo-300 px-3 text-xs font-bold text-indigo-900 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-200`:`h-8 bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700`,children:e.teacher_profile?.is_verified?S(`admin.unverify_teacher`):S(`admin.verify_teacher`)}),(0,g.jsxs)(m,{size:`sm`,variant:`destructive`,onClick:()=>Pe({id:e.id,name:e.full_name}),className:`h-8 bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700`,children:[(0,g.jsx)(_e,{className:`mr-1 h-3.5 w-3.5`}),` `,S(`admin.delete_teacher`)]})]})]}),(0,g.jsxs)(`div`,{className:`mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 text-xs`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white/80 p-2.5 shadow-2xs dark:border-gray-800 dark:bg-gray-800/60`,children:[(0,g.jsx)(`div`,{className:`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400`,children:(0,g.jsx)(fe,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,g.jsx)(`div`,{className:`text-[10px] font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400`,children:`Phone Number`}),e.phone_number||e.teacher_profile?.phone_number?(0,g.jsx)(`a`,{href:`tel:${e.phone_number||e.teacher_profile?.phone_number}`,className:`truncate font-bold text-emerald-700 hover:underline dark:text-emerald-300 block`,children:e.phone_number||e.teacher_profile?.phone_number}):(0,g.jsx)(`span`,{className:`text-gray-400 italic`,children:`No phone recorded`})]})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white/80 p-2.5 shadow-2xs dark:border-gray-800 dark:bg-gray-800/60`,children:[(0,g.jsx)(`div`,{className:`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400`,children:(0,g.jsx)(pe,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,g.jsx)(`div`,{className:`text-[10px] font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400`,children:`Telegram Account`}),e.telegram_username?(0,g.jsxs)(`a`,{href:`https://t.me/${e.telegram_username.replace(/^@/,``)}`,target:`_blank`,rel:`noopener noreferrer`,className:`truncate font-bold text-sky-600 hover:underline dark:text-sky-300 block`,children:[`@`,e.telegram_username.replace(/^@/,``)]}):e.telegram_chat_id?(0,g.jsxs)(`span`,{className:`truncate font-semibold text-sky-700 dark:text-sky-300 block`,children:[`Linked (Chat ID: `,e.telegram_chat_id,`)`]}):(0,g.jsx)(`span`,{className:`text-gray-400 italic`,children:`Not connected`})]})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white/80 p-2.5 shadow-2xs dark:border-gray-800 dark:bg-gray-800/60`,children:[(0,g.jsx)(`div`,{className:`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400`,children:(0,g.jsx)(ce,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,g.jsx)(`div`,{className:`text-[10px] font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400`,children:`Email Address`}),(0,g.jsx)(`a`,{href:`mailto:${e.email}`,className:`truncate font-bold text-indigo-700 hover:underline dark:text-indigo-300 block`,children:e.email||`N/A`})]})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white/80 p-2.5 shadow-2xs dark:border-gray-800 dark:bg-gray-800/60`,children:[(0,g.jsx)(`div`,{className:`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF4FB] text-[#1E2A5A] dark:bg-[#1E2A5A]/30 dark:text-[#A9C6E8]`,children:(0,g.jsx)(ve,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,g.jsx)(`div`,{className:`text-[10px] font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400`,children:`Gender`}),(0,g.jsx)(`span`,{className:`font-semibold text-gray-800 dark:text-gray-200`,children:e.gender===`male`?`Male`:e.gender===`female`?`Female`:`Not specified`})]})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white/80 p-2.5 shadow-2xs dark:border-gray-800 dark:bg-gray-800/60`,children:[(0,g.jsx)(`div`,{className:`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400`,children:(0,g.jsx)(Se,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,g.jsx)(`div`,{className:`text-[10px] font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400`,children:`Joined Date`}),(0,g.jsx)(`span`,{className:`font-semibold text-gray-800 dark:text-gray-200`,children:e.created_at?new Date(e.created_at).toLocaleDateString(void 0,{year:`numeric`,month:`short`,day:`numeric`}):`N/A`})]})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white/80 p-2.5 shadow-2xs dark:border-gray-800 dark:bg-gray-800/60`,children:[(0,g.jsx)(`div`,{className:`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400`,children:(0,g.jsx)(he,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,g.jsx)(`div`,{className:`text-[10px] font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400`,children:`Google Account`}),(0,g.jsx)(`span`,{className:`font-semibold text-gray-800 dark:text-gray-200`,children:e.google_connected?`Connected`:`Not connected`})]})]})]})]}),(0,g.jsx)(`p`,{className:`headline`,children:e.teacher_profile?.headline||`Professional English Speaking Tutor`}),(0,g.jsxs)(`div`,{className:`head-meta`,children:[I.length>0&&(I[0]?.speaking||e.teacher_profile?.speaking_band)&&(0,g.jsxs)(`div`,{className:`score-chip hero`,children:[(0,g.jsx)(`span`,{className:`sv`,children:I[0]?.speaking||e.teacher_profile?.speaking_band}),(0,g.jsx)(`span`,{className:`sl`,children:`Speaking band`})]}),I.length>0&&(I[0]?.overall||e.teacher_profile?.overall_level)&&(0,g.jsxs)(`div`,{className:`score-chip`,children:[(0,g.jsx)(`span`,{className:`sv`,children:I[0]?.overall||(e.teacher_profile?.overall_level?e.teacher_profile.overall_level.replace(/IELTS\s*,?\s*/i,``).trim():``)}),(0,g.jsxs)(`span`,{className:`sl`,children:[`Overall`,` `,I[0]?.type===`other`&&I[0]?.custom_type_name?I[0].custom_type_name:I[0]?.type?String(I[0].type).toUpperCase():`IELTS`]})]}),(0,g.jsxs)(`div`,{className:`score-chip`,children:[(0,g.jsx)(`span`,{className:`sv`,children:s?.total_conversations??0}),(0,g.jsx)(`span`,{className:`sl`,children:S(`dashboard.completed_conversations`)})]}),(0,g.jsxs)(`div`,{className:`score-chip`,children:[(0,g.jsx)(`span`,{className:`sv`,children:ue(s?.total_minutes??s?.total_time_formatted,C)}),(0,g.jsx)(`span`,{className:`sl`,children:S(`dashboard.speaking_time`)})]}),(0,g.jsxs)(`span`,{className:`new-badge`,children:[(0,g.jsx)(he,{className:`spark h-3.5 w-3.5 fill-amber-400 text-amber-500`}),S(`teacher.taking_first_students_${e.gender===`male`?`his`:e.gender===`female`?`her`:`their`}`)||(e.gender===`male`?`New on ConvoMate — taking his first students`:e.gender===`female`?`New on ConvoMate — taking her first students`:`New on ConvoMate — taking their first students`)]})]})]})]}),(0,g.jsxs)(`div`,{className:`body-grid`,children:[(0,g.jsxs)(`div`,{className:`main-card shadow-sm`,children:[e.teacher_profile?.intro_video_url&&(0,g.jsxs)(`div`,{className:`section`,children:[(0,g.jsxs)(`div`,{className:`sec-title`,children:[(0,g.jsx)(`span`,{className:`n`,children:(0,g.jsx)(Ce,{className:`h-3.5 w-3.5`})}),e.gender===`male`?S(`teacher.hear_his_speaking_first`,`Hear his speaking first`):e.gender===`female`?S(`teacher.hear_her_speaking_first`,`Hear her speaking first`):S(`teacher.hear_their_speaking_first`,`Hear their speaking first`)]}),Qe?(0,g.jsx)(`div`,{className:`aspect-video w-full overflow-hidden rounded-2xl border bg-black`,children:(0,g.jsx)(`video`,{src:e.teacher_profile.intro_video_url,controls:!0,autoPlay:!0,className:`h-full w-full object-cover`})}):(0,g.jsxs)(`div`,{className:`intro`,tabIndex:0,role:`button`,"aria-label":`Play intro video`,onClick:()=>$e(!0),onKeyDown:e=>{(e.key===`Enter`||e.key===` `)&&$e(!0)},children:[(0,g.jsx)(`div`,{className:`glow`}),(0,g.jsx)(`div`,{className:`play`,children:(0,g.jsx)(`svg`,{viewBox:`0 0 20 20`,className:`fill-navy h-4.5 w-4.5`,children:(0,g.jsx)(`path`,{d:`M4 2 L18 10 L4 18 Z`})})}),(0,g.jsxs)(`div`,{className:`tag`,children:[(0,g.jsx)(`span`,{className:`rec`}),` `,`Unscripted — a real hello`]}),(0,g.jsx)(`div`,{className:`dur`,children:`100MB max`})]})]}),(0,g.jsxs)(`div`,{className:`section`,children:[(0,g.jsxs)(`div`,{className:`sec-title`,children:[(0,g.jsx)(`span`,{className:`n`,children:(0,g.jsx)(ve,{className:`h-3.5 w-3.5`})}),`About `,e.full_name.split(` `)[0]]}),(0,g.jsx)(`div`,{className:`bio`,children:e.teacher_profile?.bio||`No bio description provided yet.`}),e.teacher_profile?.labels&&e.teacher_profile.labels.length>0&&(0,g.jsx)(`div`,{className:`chips`,children:e.teacher_profile.labels.map(e=>(0,g.jsx)(`span`,{className:`chip`,children:S(`labels.${e}`)||e},e))})]}),(0,g.jsxs)(`div`,{className:`section`,children:[(0,g.jsxs)(`div`,{className:`sec-title`,children:[(0,g.jsx)(`span`,{className:`n`,children:(0,g.jsx)(te,{className:`h-3.5 w-3.5`})}),`Certificates`]}),I.length>0?(0,g.jsx)(`div`,{className:`space-y-4`,children:I.map((t,n)=>{let i=ke(t.type),a=t.language?Ae.find(e=>e.id===t.language):null,ee=t.custom_language?t.custom_language:a?S(a.labelKey,a.label):S(i.languageBadgeKey,i.fallbackLanguageBadge),s=i.skills.map(e=>{let n=t[e.key]??t.sub_scores?.[e.key]??``;return{label:S(e.labelKey,e.fallbackLabel),value:n||`—`}});return(0,g.jsxs)(`div`,{className:`space-y-3.5 rounded-2xl border border-[#E6E9F2] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-card`,children:[(0,g.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-2`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5`,children:[(0,g.jsx)(`div`,{className:`flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1E2A5A] dark:bg-white/10 dark:text-brand-yellow`,children:(0,g.jsx)(te,{className:`h-4.5 w-4.5`})}),(0,g.jsx)(`div`,{children:(0,g.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2`,children:[(0,g.jsx)(`h4`,{className:`text-sm font-bold text-[#1E2A5A] dark:text-white`,children:t.title||i.label}),(0,g.jsx)(`span`,{className:`inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300`,children:ee})]})})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-2`,children:[t.status===`verified`?(0,g.jsx)(`span`,{className:`inline-flex items-center rounded-full bg-[#F7DE8B] px-3 py-1 text-xs font-bold text-[#1E2A5A] dark:border dark:border-amber-500/20 dark:bg-amber-950/60 dark:text-brand-yellow`,children:`✓ Verified`}):(0,g.jsx)(`span`,{className:`inline-flex items-center rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-bold text-[#6B7394] dark:bg-white/10 dark:text-slate-400`,children:`Under review`}),t.file_url&&(0,g.jsxs)(`button`,{type:`button`,onClick:()=>k(t),className:`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/90 px-2.5 py-1 text-xs font-bold text-indigo-700 shadow-2xs transition hover:bg-indigo-100 hover:text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300`,children:[(0,g.jsx)(ae,{className:`h-3.5 w-3.5`}),(0,g.jsx)(`span`,{children:S(`teacher.view_certificate`,`View Certificate`)})]}),x?.user?.role===`admin`&&(0,g.jsx)(m,{size:`sm`,variant:t.status===`verified`?`outline`:`default`,onClick:()=>{o.post(`/admin/teachers/${e.id}/certificates/${n}/verify`,{status:t.status===`verified`?`under_review`:`verified`})},className:t.status===`verified`?`h-6 px-2 text-[11px] font-bold`:`h-6 bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-700`,children:t.status===`verified`?S(`admin.unverify_certificate`):S(`admin.verify_certificate`)})]})]}),(0,g.jsxs)(`div`,{className:`rounded-xl border border-[#E6E9F2]/60 bg-[#FAFBFD] p-3 dark:border-white/10 dark:bg-white/5`,children:[(0,g.jsxs)(`div`,{className:`flex items-center justify-between border-b border-[#E6E9F2]/60 pb-2 dark:border-white/10`,children:[(0,g.jsx)(`span`,{className:`text-xs font-bold text-[#6B7394] dark:text-slate-400`,children:S(i.overall.labelKey,i.overall.fallbackLabel)}),(0,g.jsx)(`span`,{className:`rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-extrabold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300`,children:t.overall||`—`})]}),s.length>0&&(0,g.jsx)(`div`,{className:`mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4`,children:s.map((e,t)=>(0,g.jsxs)(`div`,{className:`rounded-lg border border-[#E6E9F2]/60 bg-white p-2 text-center shadow-2xs dark:border-white/10 dark:bg-card`,children:[(0,g.jsx)(`span`,{className:`block truncate text-[10px] font-bold text-[#6B7394] uppercase dark:text-slate-400`,children:e.label}),(0,g.jsx)(`span`,{className:`text-xs font-extrabold text-[#1E2A5A] dark:text-brand-yellow`,children:e.value})]},t))})]}),t.file_url?(()=>{let e=!!(t.file_name?.toLowerCase().endsWith(`.pdf`)||t.file_url?.toLowerCase().includes(`.pdf`));return(0,g.jsxs)(`div`,{className:`space-y-2.5 pt-1`,children:[(0,g.jsxs)(`div`,{role:`button`,tabIndex:0,onClick:()=>k(t),onKeyDown:e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),k(t))},className:`group relative flex h-32 w-full sm:w-56 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-2xs transition-all hover:border-indigo-400 hover:shadow-md dark:border-white/10 dark:bg-card`,title:S(`teacher.click_to_expand`,`Click to expand`),children:[e?(0,g.jsxs)(`div`,{className:`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-3 text-center dark:from-gray-900 dark:to-indigo-950/40`,children:[(0,g.jsx)(`span`,{className:`flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-xs`,children:(0,g.jsx)(c,{className:`h-5 w-5`})}),(0,g.jsx)(`span`,{className:`mt-2 max-w-[90%] truncate text-[11px] font-bold text-gray-800 dark:text-gray-200`,children:t.file_name||t.title||`certificate.pdf`}),(0,g.jsx)(`span`,{className:`mt-0.5 text-[9px] font-semibold text-indigo-600 dark:text-indigo-400`,children:`PDF Document`})]}):(0,g.jsx)(`img`,{src:t.file_url,alt:t.file_name||t.title||`Certificate`,className:`h-full w-full object-cover object-center transition duration-300 group-hover:scale-105`,loading:`lazy`}),(0,g.jsxs)(`div`,{className:`absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/60 text-white opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100`,children:[(0,g.jsx)(le,{className:`h-6 w-6 mb-1 text-white`}),(0,g.jsx)(`span`,{className:`text-[11px] font-bold`,children:S(`teacher.click_to_expand`,`Click to expand`)})]})]}),(0,g.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-2`,children:[(0,g.jsxs)(`span`,{className:`flex items-center gap-1.5 text-xs font-medium text-[#6B7394]`,children:[(0,g.jsx)(c,{className:`h-3.5 w-3.5`}),(0,g.jsx)(`span`,{className:`truncate max-w-[180px] sm:max-w-xs`,children:t.file_name||`Certificate Document`})]}),(0,g.jsxs)(`button`,{type:`button`,onClick:()=>k(t),className:`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 hover:text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300`,children:[(0,g.jsx)(ae,{className:`h-3.5 w-3.5`}),(0,g.jsx)(`span`,{children:S(`teacher.view_certificate`,`View Certificate`)})]})]})]})})():(0,g.jsx)(`div`,{className:`mt-3`,children:x?.user?.id===e.id?(0,g.jsxs)(`div`,{className:`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,g.jsx)(c,{className:`h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0`}),(0,g.jsx)(`span`,{children:S(`teacher.certificate_file_missing_owner`,`Certificate document file is not attached yet. Please upload it in your profile settings.`)})]}),(0,g.jsxs)(r,{href:`/settings/profile`,className:`inline-flex items-center gap-1 shrink-0 font-bold text-indigo-700 underline hover:text-indigo-900 dark:text-indigo-300`,children:[S(`teacher.upload_document`,`Upload in Settings`),` →`]})]}):x?.user?.role===`admin`?(0,g.jsxs)(`div`,{className:`flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-3 text-xs text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400`,children:[(0,g.jsx)(c,{className:`h-4 w-4 text-gray-400 shrink-0`}),(0,g.jsx)(`span`,{children:S(`teacher.certificate_file_not_uploaded`,`No certificate document file uploaded.`)})]}):(0,g.jsxs)(`div`,{className:`flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 text-xs text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400`,children:[(0,g.jsx)(c,{className:`h-4 w-4 text-gray-400 shrink-0`}),(0,g.jsx)(`span`,{children:S(`teacher.certificate_document_pending`,`Certificate document file is being updated.`)})]})})]},n)})}):(0,g.jsx)(`p`,{className:`text-sm font-medium text-muted-foreground italic`,children:`No certificates uploaded yet.`})]}),_&&_.length>0&&(0,g.jsxs)(`div`,{className:`section`,children:[(0,g.jsxs)(`div`,{className:`sec-title justify-between`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5`,children:[(0,g.jsx)(`span`,{className:`n`,children:(0,g.jsx)(d,{className:`h-3.5 w-3.5`})}),(0,g.jsx)(`span`,{children:S(`packages.title`)||`Conversation Packs`})]}),(0,g.jsx)(`span`,{className:`rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 dark:border-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-300`,children:S(`packages.discount_badge`,{discount:`10-30`})||`Special Discount`})]}),(0,g.jsx)(`p`,{className:`mb-4 text-xs leading-relaxed text-[#6B7394] dark:text-slate-400`,children:S(`packages.subtitle`)||`Purchase discounted conversation hours with this teacher in bulk and use them anytime for free bookings.`}),w>0&&(0,g.jsxs)(`div`,{className:`mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 shadow-xs dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-200`,children:[(0,g.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5`,children:[(0,g.jsx)(`div`,{className:`flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300`,children:(0,g.jsx)(re,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{children:[(0,g.jsx)(`p`,{className:`font-bold text-emerald-950 dark:text-emerald-100`,children:y.length>1?S(`packages.active_packs_title`)||`Active Conversation Packs`:S(`packages.active_package`)||`Active Conversation Pack`}),(0,g.jsx)(`p`,{className:`text-[12px] font-semibold text-emerald-700 dark:text-emerald-300`,children:y.length>1?S(`packages.hours_remaining_across_packs`,{hours:l(w,C),count:y.length})||`${l(w,C)} across ${y.length} active packs`:`${y[0]?.package_title||v?.package_title||`Pack`} · ${l(w,C)}`})]})]}),(0,g.jsx)(`span`,{className:`rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs`,children:S(`packages.status_active`)||`Active`})]}),y.length>0&&(0,g.jsx)(`div`,{className:`mt-3 space-y-2 border-t border-emerald-200/70 pt-3`,children:y.map(e=>{let t=Math.round((e.total_minutes||0)/60),n=f(e.remaining_minutes,C),r=e.total_minutes>0?Math.min(100,Math.max(0,Math.round(e.remaining_minutes/e.total_minutes*100))):0;return(0,g.jsxs)(`div`,{className:`flex flex-col gap-1.5 rounded-xl border border-emerald-200/60 bg-white/80 p-2.5 shadow-2xs dark:border-emerald-500/20 dark:bg-emerald-950/40`,children:[(0,g.jsxs)(`div`,{className:`flex items-center justify-between text-[11px]`,children:[(0,g.jsx)(`span`,{className:`font-bold text-emerald-950 dark:text-emerald-100`,children:e.package_title}),(0,g.jsx)(`span`,{className:`font-semibold text-emerald-800 dark:text-emerald-300`,children:S(`packages.hours_left_of`,{left:n,total:t})||`${n} left of ${t}h`})]}),(0,g.jsx)(`div`,{className:`h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/50`,children:(0,g.jsx)(`div`,{className:`h-full rounded-full bg-emerald-500 transition-all duration-300`,style:{width:`${r}%`}})})]},e.id)})})]}),b&&(0,g.jsxs)(`div`,{className:`mb-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-200`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5`,children:[(0,g.jsx)(`div`,{className:`flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300`,children:(0,g.jsx)(be,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{children:[(0,g.jsx)(`p`,{className:`font-bold text-amber-950 dark:text-amber-100`,children:S(`packages.pending_verification`)||`Payment Verification Pending`}),(0,g.jsxs)(`p`,{className:`text-[11.5px] text-amber-700 dark:text-amber-300`,children:[b.package_title,` · Admin will approve your payment shortly.`]})]})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,g.jsx)(`button`,{type:`button`,onClick:()=>P({title:b.package_title,price:b.price_paid,teacherName:e.full_name,pupilPackageId:b.id}),className:`cursor-pointer rounded-xl bg-amber-200/90 hover:bg-amber-300 px-3 py-1.5 text-[11px] font-bold text-amber-950 transition-colors shadow-xs dark:bg-amber-900/70 dark:text-amber-100 dark:hover:bg-amber-800`,children:S(`packages.view_payment_details`)||`Payment Details`}),(0,g.jsx)(`span`,{className:`rounded-full bg-amber-200/60 px-2.5 py-1 text-[10.5px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300`,children:`Verifying`})]})]}),(0,g.jsx)(`div`,{className:`grid gap-3 sm:grid-cols-2`,children:_.map(e=>{let t=Y*e.total_hours,n=t>e.price?t-e.price:0;return(0,g.jsxs)(`div`,{className:`relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${y&&y.some(t=>t.teacher_package_id===e.id&&t.remaining_minutes>0)||v?.teacher_package_id===e.id&&v?.remaining_minutes>0?`border-emerald-300 bg-emerald-50/30 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-950/30`:`border-[#E6E9F2] bg-[#FAFBFD] hover:border-[#1E2A5A]/30 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-card dark:hover:border-white/20 dark:hover:bg-white/5`}`,children:[e.discount_percentage&&e.discount_percentage>0?(0,g.jsx)(`span`,{className:`absolute top-3 right-3 rounded-full bg-[#1E2A5A] px-2 py-0.5 text-[10px] font-extrabold text-[#F7DE8B] dark:border dark:border-amber-500/30 dark:bg-amber-950/80 dark:text-brand-yellow`,children:S(`packages.discount_badge`,{discount:e.discount_percentage})||`${e.discount_percentage}% OFF`}):null,(0,g.jsxs)(`div`,{children:[(0,g.jsx)(`h4`,{className:`text-sm font-bold text-[#1E2A5A] dark:text-white`,children:e.title}),(0,g.jsx)(`p`,{className:`mt-0.5 text-xs font-semibold text-[#6B7394] dark:text-slate-400`,children:u(e.total_hours,C)}),e.description&&(0,g.jsx)(`p`,{className:`mt-2 text-xs leading-relaxed text-[#6B7394] dark:text-slate-400`,children:e.description})]}),(0,g.jsx)(`div`,{className:`mt-4 border-t border-[#E6E9F2] pt-3 dark:border-white/10`,children:(0,g.jsxs)(`div`,{className:`flex items-baseline justify-between`,children:[(0,g.jsxs)(`div`,{children:[(0,g.jsxs)(`div`,{className:`text-base font-extrabold text-[#1E2A5A] dark:text-brand-yellow`,children:[e.price.toLocaleString(`ru-RU`).replace(/,/g,` `),` so'm`]}),n>0&&(0,g.jsx)(`div`,{className:`text-[11px] font-medium text-emerald-600 dark:text-emerald-400`,children:S(`packages.savings`,{amount:`${n.toLocaleString(`ru-RU`).replace(/,/g,` `)} so'm`})||`Save ${n.toLocaleString(`ru-RU`).replace(/,/g,` `)} so'm`})]}),x?.user?.role!==`teacher`&&(0,g.jsx)(`button`,{type:`button`,onClick:()=>j(e),className:`cursor-pointer rounded-xl bg-[#F7DE8B] px-3.5 py-1.5 text-xs font-bold text-[#1E2A5A] shadow-xs transition hover:bg-[#F0CE5F]`,children:S(`packages.buy_button`)||`Buy Pack`})]})})]},e.id)})})]}),(0,g.jsxs)(`div`,{className:`section`,children:[(0,g.jsxs)(`div`,{className:`sec-title`,children:[(0,g.jsx)(`span`,{className:`n`,children:(0,g.jsx)(Me,{className:`h-3.5 w-3.5`})}),`Pupil feedback`]}),e.feedbacks&&e.feedbacks.length>0?(0,g.jsx)(`div`,{className:`space-y-4`,children:e.feedbacks.map(e=>(0,g.jsxs)(`div`,{className:`rounded-2xl border border-muted/50 bg-[#FAFBFD] p-5 shadow-sm dark:border-white/10 dark:bg-white/5`,children:[(0,g.jsxs)(`div`,{className:`mb-3 flex items-center justify-between`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,g.jsx)(`div`,{className:`flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#EEF4FB] text-xs font-bold text-[#1E2A5A] dark:bg-white/10 dark:text-brand-yellow`,children:e.author?.avatar?(0,g.jsx)(`img`,{src:e.author.avatar,className:`h-full w-full object-cover`,alt:`avatar`}):e.author?.full_name?.substring(0,2).toUpperCase()||`P`}),(0,g.jsxs)(`div`,{children:[(0,g.jsx)(`h4`,{className:`text-sm font-bold text-[#1E2A5A] dark:text-white`,children:e.author?.full_name||`Pupil`}),(0,g.jsx)(`p`,{className:`mt-0.5 text-[10px] font-semibold text-muted-foreground dark:text-slate-400`,children:new Date(e.created_at).toLocaleDateString([],{month:`short`,day:`numeric`,year:`numeric`})})]})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-1 rounded-lg border border-amber-500/10 bg-amber-500/5 px-2.5 py-1 text-xs font-bold text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400`,children:[(0,g.jsx)(ge,{className:`h-3 w-3 fill-amber-500 text-amber-500`}),` `,e.rating,`/10`]})]}),(0,g.jsxs)(`p`,{className:`text-sm leading-relaxed text-[#6B7394] italic dark:text-slate-300`,children:[`"`,e.comment,`"`]})]},e.id))}):(0,g.jsxs)(`div`,{className:`fb-empty`,children:[(0,g.jsx)(`div`,{className:`big`,children:S(`teacher.no_reviews_be_${e.gender===`male`?`his`:e.gender===`female`?`her`:`their`}`)||(e.gender===`male`?`No reviews yet — be his first`:e.gender===`female`?`No reviews yet — be her first`:`No reviews yet — be their first`)}),(0,g.jsxs)(`p`,{children:[e.full_name,` is new here. Book a first session at half price and help other students decide.`]})]})]})]}),(0,g.jsx)(`aside`,{children:(0,g.jsxs)(`div`,{className:`book shadow-sm`,children:[(0,g.jsxs)(`svg`,{className:`corner`,viewBox:`0 0 64 64`,fill:`none`,stroke:`#F0CE5F`,strokeWidth:`1.2`,children:[(0,g.jsx)(`path`,{d:`M64 0 v40 M64 0 h-40`}),(0,g.jsx)(`path`,{d:`M52 0 v12 h12 M40 0 v24 h24`}),(0,g.jsx)(`circle`,{cx:`52`,cy:`12`,r:`3`})]}),(0,g.jsxs)(`div`,{className:`price-row`,children:[(0,g.jsx)(`span`,{className:`price`,children:at}),(0,g.jsx)(`span`,{className:`per`,children:`/ hour`})]}),w>0&&(0,g.jsxs)(`div`,{className:`mt-3.5 mb-1 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-200`,children:[(0,g.jsxs)(`div`,{className:`flex items-center justify-between font-bold`,children:[(0,g.jsxs)(`span`,{className:`flex items-center gap-1.5 text-emerald-900 dark:text-emerald-100`,children:[(0,g.jsx)(d,{className:`h-4 w-4 text-emerald-600 dark:text-emerald-400`}),y&&y.length>1?S(`packages.active_packs_title`)||`Active Packs`:S(`packages.active_package`)||`Active Pack`]}),(0,g.jsx)(`span`,{className:`rounded-full bg-emerald-200 px-2 py-0.5 text-[11px] font-extrabold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200`,children:l(w,C)})]}),(0,g.jsx)(`p`,{className:`mt-1 text-[11.5px] leading-snug text-emerald-700 dark:text-emerald-300`,children:Z?S(`packages.covered_badge`)||`Covered by your Pack (Free Booking)`:S(`packages.insufficient_minutes`,{remaining:f(w,C),duration:f(X,C)})||`Pack has ${f(w,C)} left. Standard rate applies for this ${f(X,C)} session.`})]}),b&&(0,g.jsxs)(`div`,{className:`mt-3.5 mb-1 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-200`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300`,children:[(0,g.jsx)(be,{className:`h-3.5 w-3.5 text-amber-600 dark:text-amber-400`}),(0,g.jsx)(`span`,{children:`Payment Verification Pending`})]}),(0,g.jsx)(`p`,{className:`mt-0.5 text-[11px] text-amber-700 dark:text-amber-300`,children:b.package_title})]}),(0,g.jsx)(`div`,{className:`rail-label`,children:`Lesson type`}),t&&(0,g.jsxs)(`div`,{className:`ltype trial ${T===`trial`?`sel`:``}`,onClick:()=>{E(`trial`),z(null)},children:[(0,g.jsxs)(`div`,{className:`flex items-center justify-between gap-2`,children:[(0,g.jsxs)(`div`,{className:`flex min-w-0 flex-wrap items-center gap-2`,children:[(0,g.jsx)(`span`,{className:`text-[15px] font-bold text-[#22284A] dark:text-white`,style:{fontFamily:`'Bricolage Grotesque', sans-serif`},children:`Trial lesson`}),(0,g.jsx)(`span`,{className:`rounded-full bg-[#1E2A5A] px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-wider whitespace-nowrap text-[#F7DE8B] uppercase dark:bg-amber-400/20 dark:text-amber-300 dark:border dark:border-amber-400/30`,children:`First time only`})]}),(0,g.jsx)(`span`,{className:`text-[15px] font-bold whitespace-nowrap text-[#1E2A5A] dark:text-brand-yellow`,style:{fontFamily:`'Bricolage Grotesque', sans-serif`},children:st})]}),(0,g.jsxs)(`div`,{className:`mt-1.5 text-[12.5px] leading-snug text-[#6B7394] dark:text-slate-400`,children:[`20 minutes to meet`,` `,e.full_name?.split(` `)[0]||`teacher`,` `,`— ⅓ of `,ft,` hourly lesson price. One per teacher.`]})]}),(0,g.jsxs)(`div`,{className:`ltype ${T===`full`?`sel`:``}`,onClick:()=>{E(`full`),z(null)},children:[(0,g.jsxs)(`div`,{className:`flex items-center justify-between gap-2`,children:[(0,g.jsx)(`span`,{className:`text-[15px] font-bold text-[#22284A] dark:text-white`,style:{fontFamily:`'Bricolage Grotesque', sans-serif`},children:`Full lesson`}),(0,g.jsx)(`span`,{className:`text-[15px] font-bold whitespace-nowrap text-[#1E2A5A] dark:text-brand-yellow`,style:{fontFamily:`'Bricolage Grotesque', sans-serif`},children:lt})]}),(0,g.jsxs)(`div`,{className:`mt-1.5 text-[12.5px] leading-snug text-[#6B7394] dark:text-slate-400`,children:[`Regular session at `,ft,` standard rate. Pick your length below.`]})]}),(0,g.jsxs)(`div`,{className:`mt-3.5 mb-2`,children:[(0,g.jsxs)(`div`,{className:`rail-label`,style:{marginTop:`12px`},children:[`Duration`,` `,T===`full`?``:`(Full lesson)`]}),(0,g.jsx)(`div`,{className:`durs`,children:[{mins:30,label:de(30,C)},{mins:60,label:u(1,C)},{mins:90,label:u(1.5,C)},{mins:120,label:u(2,C)}].map(e=>(0,g.jsx)(`span`,{className:`dur ${T===`full`&&O===e.mins?`sel`:``}`,onClick:()=>{Fe(e.mins),E(`full`),z(null)},children:e.label},e.mins))})]}),(0,g.jsx)(`div`,{className:`rail-label`,children:`Pick a day`}),(0,g.jsx)(`div`,{className:`day-tabs`,children:ze.map((e,t)=>{let n=et(e)===et(L),r=e.toLocaleDateString(`en-US`,{weekday:`short`}),i=e.getDate();return(0,g.jsxs)(`div`,{className:`day-tab ${n?`active`:``}`,tabIndex:0,onClick:()=>{Be(e),z(null)},onKeyDown:t=>{(t.key===`Enter`||t.key===` `)&&(Be(e),z(null))},children:[(0,g.jsx)(`div`,{className:`dn`,children:r}),(0,g.jsx)(`div`,{className:`dd`,children:i})]},t)})}),(0,g.jsx)(`div`,{className:`rail-label`,children:`Pick a time`}),Ue?(0,g.jsx)(`div`,{className:`flex items-center justify-center py-6`,children:(0,g.jsx)(se,{className:`h-6 w-6 animate-spin text-[#1E2A5A]`})}):(()=>{let e=T===`trial`?1:Math.ceil(O/30),t=Ve.filter(t=>{if(t.is_all_time)return!0;let n=new Date(t.start_at).getTime();for(let t=1;t<e;t++){let e=n+t*30*60*1e3;if(!Ve.some(t=>Math.abs(new Date(t.start_at).getTime()-e)<6e4))return!1}return!0});return t.length>0?(0,g.jsx)(`div`,{className:`slots`,children:t.map((e,t)=>{let n=R===e,r=new Date(e.start_at).toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`,hour12:!1});return(0,g.jsx)(`button`,{className:`slot ${n?`picked`:``}`,onClick:()=>z(e),children:e.is_all_time?`Custom Slot`:r},t)})}):(0,g.jsxs)(`p`,{className:`py-2 text-xs text-muted-foreground italic`,children:[`No available slots for this day for the selected duration (`,f(O,C),`).`]})})(),(0,g.jsx)(`p`,{className:`tz`,children:`Times in your timezone — Tashkent (UTC+5)`}),R&&(0,g.jsxs)(`div`,{className:`mt-3.5 rounded-xl border border-[#E8E6DE] bg-[#F7F6F2] p-3 text-[13px] leading-relaxed text-[#6B7394] dark:border-white/10 dark:bg-white/5 dark:text-slate-300`,children:[(0,g.jsx)(`b`,{className:`text-[#22284A] dark:text-white`,children:T===`trial`?`Trial · ${f(20,C)}`:`Full lesson · ${f(O,C)}`}),` `,`with`,` `,e.full_name?.split(` `)[0]||`teacher`,(0,g.jsx)(`br`,{}),L.toLocaleDateString(`en-US`,{weekday:`short`,day:`numeric`,month:`short`}),`,`,` `,new Date(R.start_at).toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`,hour12:!1}),` `,`–`,` `,(()=>{let e=new Date(R.start_at),t=T===`trial`?20:O;return new Date(e.getTime()+t*6e4).toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`,hour12:!1})})(),` `,`·`,` `,(0,g.jsx)(`b`,{className:Z?`text-emerald-700 font-extrabold dark:text-emerald-400`:`text-[#1E2A5A] dark:text-brand-yellow font-extrabold`,children:Z?`0 so'm (Free with Pack)`:ut})]}),(0,g.jsx)(`button`,{className:`cta`,disabled:x?.user?.role===`teacher`||!R||H,onClick:()=>V(R),children:x?.user?.role===`teacher`?`Viewing Teacher Profile`:R?Z?`Book session (Free with Pack)`:`Pay ${ut} & book`:`Select a slot first`}),(0,g.jsxs)(`div`,{className:`book-meta`,children:[(0,g.jsxs)(`div`,{className:`bm-row`,children:[(0,g.jsx)(`span`,{className:`k`,children:`Where`}),(0,g.jsx)(`span`,{className:`v`,children:`Video call on ConvoMate`})]}),(0,g.jsxs)(`div`,{className:`bm-row`,children:[(0,g.jsx)(`span`,{className:`k`,children:`Cancellation`}),(0,g.jsx)(`span`,{className:`v`,children:`Free up to 12 hrs before`})]})]}),(0,g.jsxs)(`p`,{className:`assure`,children:[`A `,(0,g.jsx)(`b`,{children:`real conversation`}),` with a real teacher.`,(0,g.jsx)(`br`,{}),`No bots. No scripts. That's the point.`]})]})})]})]}),B&&(0,g.jsx)(`div`,{className:`fixed inset-0 z-[100] flex items-center justify-center bg-[#22284A]/40 backdrop-blur-sm`,children:(0,g.jsxs)(`div`,{className:`relative mx-4 flex w-full max-w-md animate-in flex-col rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-2xl duration-150 zoom-in-95 dark:border-white/10 dark:bg-card dark:text-white`,style:{fontFamily:`'Schibsted Grotesk', sans-serif`},children:[(0,g.jsx)(`button`,{onClick:()=>V(null),className:`absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#6B7394] transition-colors hover:bg-[#A9C6E8] hover:text-[#1E2A5A] dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20 dark:hover:text-white`,children:(0,g.jsx)(ye,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{className:`mt-2 flex items-start gap-4`,children:[(0,g.jsx)(`div`,{className:`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1E2A5A] dark:bg-white/10 dark:text-brand-yellow`,children:(0,g.jsx)(oe,{className:`h-5 w-5`})}),(0,g.jsxs)(`div`,{className:`flex-1`,children:[(0,g.jsx)(`h3`,{className:`text-lg font-bold text-[#1E2A5A] dark:text-white`,style:{fontFamily:`'Bricolage Grotesque', sans-serif`},children:B.is_all_time?S(`booking.all_time_title`)||`Select Custom Slot Time`:S(`booking.confirm_title`)||`Confirm Booking`}),B.is_all_time?(0,g.jsxs)(`div`,{className:`mt-3 space-y-4`,children:[(0,g.jsx)(`p`,{className:`text-sm leading-relaxed text-[#6B7394] dark:text-slate-400`,children:S(`booking.all_time_desc`)||`Choose a specific start and end time for your custom session.`}),(0,g.jsxs)(`div`,{className:`grid grid-cols-2 gap-4`,children:[(0,g.jsxs)(`div`,{className:`grid gap-1`,children:[(0,g.jsx)(`label`,{className:`text-xs font-semibold text-[#22284A] dark:text-white`,children:S(`booking.all_time_start`)||`Start Time`}),(0,g.jsx)(`input`,{type:`time`,value:U,onChange:e=>Ke(e.target.value),min:q(new Date(B.start_at)),max:q(new Date(B.end_at)),className:`mt-1 rounded-xl border border-[#E6E9F2] p-2 text-sm text-[#22284A] focus:border-[#1E2A5A] focus:outline-none dark:border-white/15 dark:bg-background dark:text-white`})]}),(0,g.jsxs)(`div`,{className:`grid gap-1`,children:[(0,g.jsx)(`label`,{className:`text-xs font-semibold text-[#22284A] dark:text-white`,children:S(`booking.all_time_end`)||`End Time`}),(0,g.jsx)(`input`,{type:`time`,value:qe,onChange:e=>W(e.target.value),min:U||q(new Date(B.start_at)),max:q(new Date(B.end_at)),className:`mt-1 rounded-xl border border-[#E6E9F2] p-2 text-sm text-[#22284A] focus:border-[#1E2A5A] focus:outline-none dark:border-white/15 dark:bg-background dark:text-white`})]})]}),!J()&&(0,g.jsx)(`p`,{className:`text-xs font-bold text-red-500`,children:S(`booking.invalid_range`)||`Selected range is invalid.`})]}):(()=>{let t=T===`trial`?20:O,n=new Date(B.start_at),r=new Date(n.getTime()+t*6e4),i=n.toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`}),a=r.toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`});return(0,g.jsx)(`p`,{className:`mt-3 text-sm leading-relaxed text-[#6B7394] dark:text-slate-400`,children:S(`booking.confirm_message`,{teacher:e.full_name,start:i,end:a})||`Book a session with ${e.full_name} from ${i} to ${a}?`})})(),(0,g.jsxs)(`div`,{className:`mt-4 space-y-2 border-t border-[#E6E9F2] pt-3 dark:border-white/10`,children:[(0,g.jsxs)(`label`,{className:`text-xs font-semibold text-[#22284A] dark:text-white`,children:[S(`booking.select_topics`)||`Select Speaking Topics`,` `,(0,g.jsx)(`span`,{className:`text-red-500`,children:`*`})]}),(0,g.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[e.teacher_profile?.labels?.map(e=>{let t=G.includes(e);return(0,g.jsx)(`button`,{type:`button`,onClick:()=>{Je(t?G.filter(t=>t!==e):[...G,e])},className:`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${t?`border-[#1E2A5A] bg-[#1E2A5A] text-white dark:border-brand-yellow dark:bg-brand-yellow dark:text-[#061445]`:`border-[#D8E5F5] bg-[#EEF4FB] text-[#1E2A5A] hover:bg-[#A9C6E8] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10`}`,children:S(`labels.${e}`)||e},e)}),(0,g.jsx)(`button`,{type:`button`,onClick:()=>Ye(!K),className:`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${K?`border-[#1E2A5A] bg-[#1E2A5A] text-white dark:border-brand-yellow dark:bg-brand-yellow dark:text-[#061445]`:`border-[#D8E5F5] bg-[#EEF4FB] text-[#1E2A5A] hover:bg-[#A9C6E8] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10`}`,children:S(`booking.topic_other`)||`Other...`})]}),K&&(0,g.jsx)(`div`,{className:`mt-2.5`,children:(0,g.jsx)(`input`,{type:`text`,placeholder:S(`booking.topic_other_placeholder`)||`Enter custom topic...`,value:Xe,onChange:e=>Ze(e.target.value),className:`w-full rounded-xl border border-[#E6E9F2] p-2 text-sm text-[#22284A] focus:border-[#1E2A5A] focus:outline-none dark:border-white/15 dark:bg-background dark:text-white`,maxLength:100})})]}),Z&&(0,g.jsxs)(`div`,{className:`mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-200`,children:[(0,g.jsx)(re,{className:`h-4 w-4 flex-shrink-0 text-emerald-600 mt-0.5`}),(0,g.jsxs)(`div`,{children:[(0,g.jsx)(`p`,{className:`font-bold text-emerald-950 dark:text-emerald-100`,children:S(`packages.covered_badge`)||`Covered by your Conversation Pack (Free)`}),(0,g.jsx)(`p`,{className:`mt-0.5 text-[11.5px] text-emerald-700 dark:text-emerald-300`,children:S(`packages.covered_session_desc`,{duration:f(X,C),remaining:f(Math.max(0,w-X),C)})})]})]}),ct&&(0,g.jsxs)(`div`,{className:`mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-200`,children:[(0,g.jsx)(ne,{className:`h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5`}),(0,g.jsxs)(`div`,{children:[(0,g.jsx)(`p`,{className:`font-bold text-amber-950 dark:text-amber-100`,children:S(`packages.insufficient_title`)||`Insufficient Conversation Pack Balance`}),(0,g.jsx)(`p`,{className:`mt-0.5 text-[11.5px] text-amber-700 dark:text-amber-300`,children:S(`packages.insufficient_minutes`,{remaining:f(w,C),duration:f(X,C)})})]})]}),!Z&&$>0&&(0,g.jsxs)(`div`,{className:`mt-4 flex items-center justify-between rounded-xl border border-[#D8E5F5] bg-[#EEF4FB]/50 p-3.5 text-xs dark:border-white/10 dark:bg-white/5`,children:[(0,g.jsxs)(`span`,{className:`text-[#6B7394] font-medium dark:text-slate-400`,children:[S(`booking.session_price`)||`Session Price`,`:`]}),(0,g.jsxs)(`span`,{className:`font-bold text-[#1E2A5A] dark:text-brand-yellow text-sm`,children:[$.toLocaleString(`ru-RU`).replace(/,/g,` `),` so'm`]})]}),(0,g.jsxs)(`div`,{className:`mt-6 flex items-center justify-end gap-3`,children:[(0,g.jsx)(`button`,{onClick:()=>V(null),className:`cursor-pointer rounded-xl border border-[#E6E9F2] px-4 py-2 text-sm font-semibold text-[#6B7394] transition-colors hover:bg-[#FAFBFD] dark:border-white/15 dark:text-slate-400 dark:hover:bg-white/5`,children:S(`booking.cancel_btn`)||`Cancel`}),(0,g.jsx)(`button`,{onClick:it,disabled:H||!J(),className:`cursor-pointer rounded-xl bg-[#F7DE8B] px-5 py-2 text-sm font-bold text-[#1E2A5A] shadow-md shadow-brand-button/10 transition-colors hover:bg-[#F0CE5F] disabled:opacity-50 dark:bg-brand-yellow dark:text-[#061445]`,children:H?S(`booking.requesting`)||`Requesting...`:Z?S(`booking.confirm_free_booking`)||`Confirm Free Booking`:S(`booking.confirm_booking`)||S(`booking.confirm_btn`)||`Confirm Booking`})]})]})]})]})}),A&&(0,g.jsx)(`div`,{className:`fixed inset-0 z-[100] flex items-center justify-center bg-[#22284A]/40 backdrop-blur-sm p-4`,children:(0,g.jsxs)(`div`,{className:`relative w-full max-w-md animate-in flex-col rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-2xl duration-150 zoom-in-95 dark:border-white/10 dark:bg-card dark:text-white`,style:{fontFamily:`'Schibsted Grotesk', sans-serif`},children:[(0,g.jsx)(`button`,{type:`button`,onClick:()=>j(null),disabled:M,className:`absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#6B7394] transition-colors hover:bg-[#A9C6E8] hover:text-[#1E2A5A] dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20 dark:hover:text-white`,children:(0,g.jsx)(ye,{className:`h-4 w-4`})}),(0,g.jsxs)(`div`,{className:`flex items-start gap-4`,children:[(0,g.jsx)(`div`,{className:`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#1E2A5A] dark:bg-white/10 dark:text-brand-yellow`,children:(0,g.jsx)(d,{className:`h-6 w-6 text-[#1E2A5A] dark:text-brand-yellow`})}),(0,g.jsxs)(`div`,{className:`flex-1`,children:[(0,g.jsx)(`h3`,{className:`text-lg font-bold text-[#1E2A5A] dark:text-white`,style:{fontFamily:`'Bricolage Grotesque', sans-serif`},children:S(`packages.buy_button`)||`Buy Conversation Pack`}),(0,g.jsxs)(`p`,{className:`mt-1 text-xs text-[#6B7394] dark:text-slate-400`,children:[e.full_name,` · `,A.title]})]})]}),(0,g.jsx)(`div`,{className:`mt-4 rounded-xl border border-[#E6E9F2] bg-[#FAFBFD] p-3 text-xs dark:border-white/10 dark:bg-white/5`,children:(0,g.jsxs)(`div`,{className:`flex justify-between items-center`,children:[(0,g.jsx)(`span`,{className:`text-[#6B7394] font-medium dark:text-slate-400`,children:S(`packages.pack_price`)||`Total Price`}),(0,g.jsxs)(`span`,{className:`font-extrabold text-base text-[#1E2A5A] dark:text-brand-yellow`,children:[A.price.toLocaleString(`ru-RU`).replace(/,/g,` `),` so'm`]})]})}),(0,g.jsxs)(`div`,{className:`mt-4 rounded-xl border border-[#D4E2F4] bg-[#EEF4FB] p-3.5 text-[11.5px] leading-relaxed text-[#1E2A5A] dark:border-white/10 dark:bg-white/5 dark:text-slate-300`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-1.5 font-bold mb-1 text-[#1E2A5A] dark:text-brand-yellow`,children:[(0,g.jsx)(oe,{className:`h-4 w-4 text-[#1E2A5A] dark:text-brand-yellow`}),(0,g.jsx)(`span`,{children:S(`voucher.how_it_works_title`)||`How it works`})]}),(0,g.jsx)(`p`,{className:`text-[#3C4569] dark:text-slate-300`,children:S(`voucher.how_it_works_desc`,{name:e.full_name})})]}),(0,g.jsxs)(`div`,{className:`mt-6 flex items-center justify-end gap-3`,children:[(0,g.jsx)(`button`,{type:`button`,onClick:()=>j(null),disabled:M,className:`cursor-pointer rounded-xl border border-[#E6E9F2] px-4 py-2 text-sm font-semibold text-[#6B7394] transition-colors hover:bg-[#FAFBFD] dark:border-white/15 dark:text-slate-400 dark:hover:bg-white/5`,children:S(`booking.cancel_btn`)||`Cancel`}),(0,g.jsx)(`button`,{type:`button`,onClick:dt,disabled:M,className:`cursor-pointer rounded-xl bg-[#F7DE8B] px-5 py-2 text-sm font-bold text-[#1E2A5A] shadow-md shadow-brand-button/10 transition-colors hover:bg-[#F0CE5F] disabled:opacity-50 dark:bg-brand-yellow dark:text-[#061445]`,children:M?S(`packages.buying`)||`Processing...`:S(`packages.buy_button`)||`Confirm & Order`})]})]})}),(0,g.jsx)(Ee,{isOpen:!!D,onClose:()=>Pe(null),userId:D?.id??null,userName:D?.name}),(0,g.jsx)(ie,{isOpen:!!Ie,onClose:()=>k(null),certificate:Ie}),N&&(0,g.jsx)(je,{isOpen:!!N,onClose:()=>P(null),pupilPackageId:N.pupilPackageId,itemTitle:N.title,amount:N.price,teacherName:N.teacherName,pupilId:x?.user?.short_id||x?.user?.id?.substring(0,8).toUpperCase(),pupilName:x?.user?.full_name})]})}_.layout={breadcrumbs:[{title:`find teachers`,href:`/pupil/teachers`},{title:`...`,href:`#`}]};export{_ as default};