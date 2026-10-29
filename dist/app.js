/* Своё Родное — конкурсный прототип. Данные синтетические, без внешних API. */
(function(){
  'use strict';
  const KEY='rshb-grow-demo-v1';
  const $=s=>document.querySelector(s);
  const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Math.round(n))+' ₽';
  const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Math.round(n));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct=n=>Number(n).toFixed(1).replace('.',',')+'%';
  const seed=()=>({
    products:[
      {id:'CHE-01',name:'Сыр фермерский, 250 г',price:720,cost:380,views:1240,orders:19,stock:90,discount:0,images:1,attrs:2,description:false,category:'Молочные продукты'},
      {id:'HON-02',name:'Мёд луговой, 500 г',price:890,cost:530,views:940,orders:38,stock:60,discount:0,images:4,attrs:5,description:true,category:'Мёд и сладости'},
      {id:'VEG-03',name:'Набор сезонных овощей',price:940,cost:690,views:820,orders:69,stock:120,discount:20,images:4,attrs:5,description:true,category:'Овощи'},
      {id:'JAM-04',name:'Варенье из малины, 300 г',price:590,cost:290,views:620,orders:26,stock:80,discount:0,images:3,attrs:4,description:true,category:'Сладости'},
      {id:'BRD-05',name:'Хлеб на закваске',price:290,cost:160,views:780,orders:67,stock:10,discount:0,images:3,attrs:5,description:true,category:'Выпечка'},
      {id:'EGG-06',name:'Яйцо фермерское, 10 шт.',price:250,cost:155,views:1250,orders:92,stock:150,discount:0,images:4,attrs:5,description:true,category:'Яйца'}
    ],
    customers:{total:214,repeat:48,lapsed:34,lapsedConsented:28,lapsedOptOut:6,frequencyLimited:3,new:132},
    decisions:{},
    history:[],
    salesMultiplier:1
  });
  let state;
  try {state=JSON.parse(localStorage.getItem(KEY))||seed()}catch(e){state=seed()}
  if(!Array.isArray(state.products)||!state.customers||!state.decisions)state=seed();
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}};
  const byId=id=>state.products.find(p=>p.id===id);
  const completeness=p=>Math.min(100,Math.round((Math.min(4,p.images)/4*.30+Math.min(5,p.attrs)/5*.50+(p.description?0.20:0))*100));
  const revenue=()=>state.products.reduce((s,p)=>s+p.orders*p.price*(1-p.discount/100),0)*state.salesMultiplier;
  const orders=()=>state.products.reduce((s,p)=>s+p.orders,0);
  const views=()=>state.products.reduce((s,p)=>s+p.views,0);
  const margin=p=>Math.max(0,p.price*(1-p.discount/100)-p.cost);
  const oneWeek=30/7;
  const now=()=>new Date().toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  let view='today', modalRef=null, toastTimer=null;
  function log(action,title,detail){state.history.unshift({date:now(),action,title,detail});state.history=state.history.slice(0,100);persist()}
  function makeRecs(){
    const items=[];
    const cheese=byId('CHE-01');
    if(cheese && completeness(cheese)<90 && cheese.views>=100){
      const current=cheese.orders/cheese.views;
      const target=.039;
      const incremental=Math.max(0,cheese.views*(target-current)*(cheese.price-cheese.cost)*7/30);
      const effect=Math.round(incremental);
      items.push({id:'card',type:'Карточка товара',icon:'▧',title:'Дополнить карточку фермерского сыра',reason:num(cheese.views)+' просмотров за 30 дней. Конверсия '+pct(current*100)+' против ориентира '+pct(target*100)+'.',effect,quality:86,effort:120,urgency:1,score:Math.round(effect*.86-120),formula:num(cheese.views)+' × ('+pct(target*100)+' − '+pct(current*100)+') × '+money(cheese.price-cheese.cost)+' × 7/30 = '+money(effect),sources:['Просмотры товара','Заказы','Цена и себестоимость'],plan:'Добавить 2–3 фотографии, описание состава и недостающие характеристики. Проверить сведения вручную.',safety:'ИИ предлагает структуру описания, но не придумывает состав или характеристики.',target:'Мои товары'});
    }
    const c=state.customers;
    const eligible=Math.max(0,c.lapsedConsented-c.frequencyLimited);
    if(eligible>0){
      const response=.27,unitGross=360,cost=140;
      const effect=Math.max(0,Math.round(eligible*response*unitGross-cost));
      items.push({id:'winback',type:'Покупатели',icon:'♡',title:'Вернуть покупателей лугового мёда',reason:c.lapsed+' покупателя не заказывали более 45 дней. Из них '+eligible+' доступны для сообщения.',effect,quality:78,effort:90,urgency:1,score:Math.round(effect*.78-90),formula:num(eligible)+' согласий × '+pct(response*100)+' ожидаемого отклика × '+money(unitGross)+' валовой маржи − '+money(cost)+' = '+money(effect),sources:['История заказов','Согласия на рассылки','Ограничение частоты'],plan:'Подготовить персональное предложение повторной покупки. Проверить сегмент, текст и канал отправки.',safety:'Исключаем отказавшихся и тех, кому писали недавно. Никаких сообщений до отдельного подтверждения.',target:'Покупатели'});
    }
    const veg=byId('VEG-03');
    if(veg && veg.discount>=15 && margin(veg)/veg.price<.10){
      const newDiscount=10,weeklyUnits=veg.orders*7/30,lossOfDemand=.10;
      const increase=veg.price*(veg.discount-newDiscount)/100;
      const effect=Math.max(0,Math.round(weeklyUnits*increase*(1-lossOfDemand)-60));
      items.push({id:'promo',type:'Акции',icon:'%',title:'Пересмотреть скидку на набор овощей',reason:'Текущая скидка '+veg.discount+'%, маржа '+pct(margin(veg)/veg.price*100)+' от базовой цены. Спрос остаётся высоким.',effect,quality:81,effort:60,urgency:1.05,score:Math.round(effect*.81*1.05-60),formula:num(weeklyUnits)+' заказов/нед. × '+money(increase)+' возврата маржи × 0,90 − 60 ₽ = '+money(effect),sources:['Заказы','Себестоимость','Действующая скидка'],plan:'Проверить сценарий снижения скидки с '+veg.discount+'% до 10% на 7 дней.',safety:'Прогноз допускает снижение заказов на 10%. Цена не меняется без подтверждения.',target:'Мои товары'});
    }
    const bread=byId('BRD-05');
    if(bread && bread.stock<Math.ceil(bread.orders*7/30)){
      const shortage=Math.max(0,Math.ceil(bread.orders*7/30)-bread.stock);
      const effect=shortage*(bread.price-bread.cost);
      items.push({id:'stock',type:'Остатки',icon:'◈',title:'Пополнить запас хлеба на закваске',reason:'Осталось '+bread.stock+' шт. Спрос на неделю оценивается в '+Math.ceil(bread.orders*7/30)+' шт.',effect,quality:74,effort:120,urgency:1.15,score:Math.round(effect*.74*1.15-120),formula:num(shortage)+' потенциально упущенных заказов × '+money(bread.price-bread.cost)+' маржи = '+money(effect),sources:['Складской остаток','Заказы за 30 дней'],plan:'Уточнить производственные мощности и назначить новую партию.',safety:'Нельзя рекомендовать объём закупки без учёта сроков годности и производственных ограничений.',target:'Мои товары'});
    }
    return items.filter(r=>r.effect>0).sort((a,b)=>b.score-a.score);
  }
  const status=id=>state.decisions[id]||'new';
  const visibleRecs=()=>makeRecs().slice(0,3);
  function render(){
    $('#breadcrumb').textContent='Обзор / '+({today:'Сегодня',products:'Мои товары',sales:'Продажи',customers:'Покупатели',method:'Как это работает',history:'История решений'}[view]);
    document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id==='view-'+view));
    document.querySelectorAll('.nav-link').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
    document.querySelector('.nav-count').textContent=visibleRecs().length;
    $('#view-today').innerHTML=renderToday();
    $('#view-products').innerHTML=renderProducts();
    $('#view-sales').innerHTML=renderSales();
    $('#view-customers').innerHTML=renderCustomers();
    $('#view-method').innerHTML=renderMethod();
    $('#view-history').innerHTML=renderHistory();
  }
  const header=(kicker,title,sub)=>'<div class="page-head"><div><div class="section-kicker">'+kicker+'</div><h1>'+title+'</h1><p>'+sub+'</p></div><span class="date-chip">✦ Демо · октябрь 2026</span></div>';
  function metric(label,value,note,extra){return '<article class="metric-card"><span class="metric-label">'+label+'</span><div class="metric-value">'+value+'</div><div class="metric-note '+(extra||'')+'">'+note+'</div></article>'}
  function recCard(r,i){
    const s=status(r.id);
    return '<article class="rec-card '+(s==='approved'?'is-approved':s==='postponed'?'is-postponed':'')+'">'+
      '<div class="rec-top"><span class="rec-number">0'+(i+1)+'</span><span class="rec-symbol">'+r.icon+'</span><div class="rec-title"><h3>'+esc(r.title)+'</h3><small>'+esc(r.type)+'</small></div><span class="confidence">Качество данных <strong>'+r.quality+'/100</strong></span></div>'+
      '<div class="rec-body"><div><span class="small-label">Почему это важно</span><div class="rec-why">'+esc(r.reason)+'</div></div><div><span class="small-label">Потенциал за 7 дней</span><div class="rec-effect">+'+money(r.effect)+'<small>оценка, не гарантия</small></div></div></div>'+
      '<div class="rec-bottom"><span class="rec-tag">'+(s==='approved'?'✓ План подтверждён':s==='postponed'?'◷ Отложено':'Приоритет: '+num(r.score)+' баллов')+'</span><button class="primary-btn" data-open="'+r.id+'">'+(s==='approved'?'Открыть план ↗':s==='postponed'?'Вернуться к плану ↗':'Разобрать действие ↗')+'</button></div></article>';
  }
  function renderToday(){
    const recs=visibleRecs();return header('Персональная аналитика','Доброе утро, Анна!','На основе данных о ферме помощник отобрал действия с наибольшим расчётным эффектом на ближайшую неделю.')+
      '<div class="metric-grid">'+metric('Выручка за 30 дней',money(revenue()),'Сумма заказов из демоданных')+metric('Заказов за 30 дней',num(orders()),'По 6 активным товарам')+metric('Конверсия каталога',pct(orders()/views()*100),'Заказы / просмотры')+metric('Активных товаров',String(state.products.length),'Карточек с пробелами: '+state.products.filter(p=>completeness(p)<90).length)+'</div>'+
      '<div class="today-grid"><div><div class="section-heading"><h2>Ваши три приоритета</h2><span>Ранжирование обновляется при изменении данных</span></div><div class="rec-list">'+(recs.length?recs.map(recCard).join(''):'<div class="empty-state">Сейчас нет рекомендаций, прошедших пороги качества.</div>')+'</div><div class="note" style="margin-top:17px">Вы контролируете каждое действие. Подтверждение означает согласование плана в демоверсии; ни одно изменение в реальных системах не происходит.</div></div>'+
      '<div class="right-stack"><article class="panel"><h3>Что анализирует помощник</h3><p>Историю покупок, показатели карточек, скидки и обезличенную клиентскую базу.</p><div class="source-chips"><span>▤ Карточки</span><span>▥ Продажи</span><span>↘ Акции</span><span>♧ Клиенты</span></div><div class="rule-math"><strong>Приоритет</strong><br>Ожидаемый эффект × качество данных × срочность − трудозатраты</div><button class="text-btn" data-view-go="method">Изучить методику ↗</button></article>'+
      '<article class="panel safe-panel"><div class="safe-icon">♢</div><h3>Решение остаётся за вами</h3><p>Помощник формирует черновики. Цены, карточки и сообщения покупателям меняются только после явного подтверждения фермера.</p></article>'+
      '<article class="panel"><h3>Контроль качества</h3><div class="info-row"><span>Минимум наблюдений</span><span class="chip">Проверено</span></div><div class="info-row"><span>Актуальность данных</span><span class="chip">30 дней</span></div><div class="info-row"><span>Журнал решений</span><span class="chip">Включён</span></div><p style="margin:14px 0 0">Оценка качества 0–100 отражает достаточность и полноту данных, а не вероятность успеха.</p></article></div></div>';
  }
  function renderProducts(){
    const rows=state.products.map(p=>{
      const ready=completeness(p);
      return '<tr><td><strong>'+esc(p.name)+'</strong><br><span class="muted">'+p.id+'</span></td><td>'+money(p.price)+'</td><td>'+num(p.views)+'</td><td>'+num(p.orders)+'</td><td><div style="display:flex;align-items:center;gap:8px"><div class="bar-track"><div class="bar-fill" style="width:'+ready+'%"></div></div>'+ready+'%</div></td><td><span class="chip '+(p.stock<15?'amber':'')+'">'+p.stock+' шт.</span></td><td><button class="table-action" data-edit="'+p.id+'">Изменить</button></td></tr>';
    }).join('');
    return header('Каталог','Мои товары','Полнота карточек, просмотры, заказы и складские остатки. Данные можно менять в деморежиме.')+
      '<div class="grid-three">'+metric('Товаров',state.products.length,'Все товары доступны в демо')+metric('Незаполненных карточек',state.products.filter(p=>completeness(p)<90).length,'Готовность менее 90%')+metric('Недостаточный запас',state.products.filter(p=>p.stock<p.orders*7/30).length,'Прогноз спроса на 7 дней')+'</div>'+
      '<section class="content-card" style="margin-top:20px"><div class="section-heading"><h2>Ассортимент</h2><span>Изменения влияют на рекомендации</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Товар</th><th>Цена</th><th>Просмотры</th><th>Заказы</th><th>Готовность</th><th>Остаток</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></section><div class="note">Оценка готовности карточки: фотографии 30%, характеристики 50%, описание 20%. Эти веса являются допущением демомодели.</div>';
  }
  function renderSales(){
    const weights=[.68,.83,.71,.94,.76,1.01,.9,1.12,.88,1.15,.91,1.27,.98,1.22],base=revenue()/30;
    const bars=weights.map((w,i)=>'<div class="chart-col" title="День '+(i+1)+': '+money(base*w)+'"><div class="chart-bar" style="height:'+Math.round(w/1.3*100)+'%"></div><small>'+(['15','16','17','18','19','20','21','22','23','24','25','26','27','28'][i])+'</small></div>').join('');
    const rows=state.products.map(p=>'<tr><td><strong>'+esc(p.name)+'</strong></td><td>'+p.orders+'</td><td>'+money(p.orders*p.price*(1-p.discount/100))+'</td><td>'+pct(p.orders/p.views*100)+'</td><td>'+money(margin(p))+'</td></tr>').join('');
    return header('Продажи','Пульс фермы','Сводка за последние 30 дней. Расчёты и дневные столбцы используют демонстрационные данные.')+
      '<div class="metric-grid">'+metric('Выручка',money(revenue()),'30 дней')+metric('Заказы',num(orders()),'30 дней')+metric('Средний чек',money(revenue()/orders()),'Выручка / заказы')+metric('Валовая маржа',money(state.products.reduce((s,p)=>s+margin(p)*p.orders,0)),'До постоянных затрат')+'</div>'+
      '<div class="grid-two"><section class="content-card"><h2>Продажи по дням</h2><p class="muted">Иллюстративная динамика последних 14 дней</p><div class="chart">'+bars+'</div><div class="chart-caption">Столбцы показывают модельную динамику, не реальные транзакции.</div></section>'+
      '<section class="content-card"><h2>Точки внимания</h2><div class="process-step"><div class="step-number">01</div><div><h3>Слабая конверсия карточки</h3><p>Сыр: '+pct(byId('CHE-01').orders/byId('CHE-01').views*100)+' покупок на просмотр.</p></div></div><div class="process-step"><div class="step-number">02</div><div><h3>Высокая скидка</h3><p>Овощной набор: скидка '+byId('VEG-03').discount+'%, маржинальность после скидки '+pct(margin(byId('VEG-03'))/byId('VEG-03').price*100)+'.</p></div></div><div class="process-step"><div class="step-number">03</div><div><h3>Низкий остаток</h3><p>Хлеб: осталось '+byId('BRD-05').stock+' шт., спрос на неделю около '+Math.ceil(byId('BRD-05').orders*7/30)+' шт.</p></div></div></section></div>'+
      '<section class="content-card"><div class="section-heading"><h2>Экономика товаров</h2><span>Валовая маржа = цена после скидки − себестоимость</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Товар</th><th>Заказы</th><th>Выручка</th><th>Конверсия</th><th>Маржа на единицу</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>';
  }
  function renderCustomers(){
    const c=state.customers,eligible=Math.max(0,c.lapsedConsented-c.frequencyLimited);
    return header('Клиентская база','Покупатели и повторные заказы','Помощник рассматривает только обезличенные сегменты. Контактов и персональных данных в прототипе нет.')+
      '<div class="metric-grid">'+metric('Покупателей',c.total,'Обезличенный агрегат')+metric('Повторных покупателей',c.repeat,'RFM: высокая частота')+metric('Не покупали 45+ дней',c.lapsed,'Кандидаты на возврат')+metric('Доступны для рассылки',eligible,'После всех исключений')+'</div>'+
      '<div class="grid-two"><section class="content-card"><div class="section-heading"><h2>Сегменты</h2><span>Агрегированные группы</span></div>'+
      '<div class="info-row"><div><strong>Постоянные</strong><br><small class="muted">Повторные покупки за 90 дней</small></div><span class="chip">'+c.repeat+'</span></div>'+
      '<div class="info-row"><div><strong>Давно не покупали</strong><br><small class="muted">Последний заказ более 45 дней назад</small></div><span class="chip amber">'+c.lapsed+'</span></div>'+
      '<div class="info-row"><div><strong>Новые</strong><br><small class="muted">Покупали один раз</small></div><span class="chip">'+c.new+'</span></div><div class="note" style="margin-top:20px">RFM: давность покупки, частота заказов и денежный объём. В прототипе показана упрощённая сегментация.</div></section>'+
      '<section class="content-card"><h2>Проверка разрешений</h2><div class="info-row"><span>Сегмент «Не покупали 45+ дней»</span><strong>'+c.lapsed+'</strong></div><div class="info-row"><span>Есть согласие на канал</span><strong>'+c.lapsedConsented+'</strong></div><div class="info-row"><span>Отказались от сообщений</span><strong class="status-postponed">−'+c.lapsedOptOut+'</strong></div><div class="info-row"><span>Лимит частоты: сообщение за последние 7 дней</span><strong class="status-postponed">−'+c.frequencyLimited+'</strong></div><div class="info-row"><strong>Итого доступно</strong><strong class="accent">'+eligible+'</strong></div><button class="primary-btn" style="margin-top:25px;width:100%" data-open="winback">Подготовить кампанию ↗</button><p class="muted" style="font-size:11px;margin-top:11px">В демоверсии сообщения не отправляются ни при каких условиях.</p></section></div>';
  }
  function renderMethod(){
    return header('Прозрачный алгоритм','Как это работает','Система формирует объяснимые предложения с проверяемой оценкой экономического эффекта. LLM используется только для формулировки текста на продакшен-этапе.')+
      '<div class="content-card"><h2>Правила выбора трёх действий</h2>'+
      '<div class="process-step"><div class="step-number">1</div><div><h3>Входные сигналы</h3><p>Товары: карточка, изображения, характеристики, цена, себестоимость, остаток. Продажи и просмотры: последние 30 дней. CRM: только агрегаты и согласия.</p></div></div>'+
      '<div class="process-step"><div class="step-number">2</div><div><h3>Детектор проблем</h3><p>Неполная карточка при значимом трафике; неактивные клиенты с разрешениями; акция с низкой маржой; риск дефицита. Минимум 100 просмотров для карточки.</p></div></div>'+
      '<div class="process-step"><div class="step-number">3</div><div><h3>Оценка ожидаемого эффекта</h3><p>Для каждой гипотезы считается дополнительная валовая маржа на 7 дней. В расчёте явно указаны исторические показатели, допущения и ограничения. Результат не является прогнозом с гарантированной точностью.</p></div></div>'+
      '<div class="process-step"><div class="step-number">4</div><div><h3>Приоритизация</h3><p>Балл = оценка маржи × коэффициент качества данных × срочность − ориентировочная стоимость работы. Выбираются три сценария с наибольшим баллом.</p></div></div>'+
      '<div class="process-step"><div class="step-number">5</div><div><h3>Человек подтверждает решение</h3><p>Пользователь видит расчёт, может отложить рекомендацию или утвердить план. В демоверсии утверждение фиксируется в журнале и ничего не изменяет во внешних системах.</p></div></div></div>'+
      '<div class="grid-two"><section class="content-card"><h2>Контроль качества</h2><div class="info-row"><span>Дедупликация рекомендаций</span><span class="chip">По типу и товару</span></div><div class="info-row"><span>Качество входных данных</span><span class="chip">0–100</span></div><div class="info-row"><span>Проверка формул и лимитов</span><span class="chip">Перед выводом</span></div><div class="info-row"><span>Запрет выдуманных фактов</span><span class="chip">Жёсткое правило</span></div><div class="info-row"><span>Верификация ожидаемого эффекта</span><span class="chip amber">A/B после запуска</span></div><p style="font-size:11px">Качество данных 86/100 — экспертный демонстрационный балл, не калиброванная вероятность успеха.</p></section>'+
      '<section class="content-card"><h2>Интеграция с платформой</h2><div class="process-step"><div class="step-number">A</div><div><h3>READ-ONLY API</h3><p>GET /products, /analytics, /promotions, /segments. У пользователя только свой tenant_id. Данные клиентов минимизируются.</p></div></div><div class="process-step"><div class="step-number">B</div><div><h3>Сервис рекомендаций</h3><p>Проверка входных данных, расчёт показателей, ранжирование, журнал версии модели и источников.</p></div></div><div class="process-step"><div class="step-number">C</div><div><h3>Подтверждение и выполнение</h3><p>POST /recommendations/{id}/approve с идемпотентным ключом. Выполнение через отдельный сценарий после разрешения; аудиторский лог.</p></div></div></section></div>'+
      '<div class="note warning">Границы MVP: интерфейс и расчёты работают локально на синтетических данных. Нет подключения к РСХБ, реального GenAI API и отправки сообщений. Для промышленного запуска нужны тесты на исторических данных, калибровка эффекта и проверка правовых оснований коммуникаций.</div>';
  }
  function renderHistory(){
    const rows=state.history.map((h,i)=>'<tr><td>'+esc(h.date)+'</td><td>'+esc(h.action)+'</td><td><strong>'+esc(h.title)+'</strong></td><td>'+esc(h.detail)+'</td></tr>').join('');
    return header('Контроль и аудит','История решений','Каждый шаг фермера сохраняется локально в этом браузере. Никаких внешних действий не запускается.')+
      '<section class="content-card"><div class="section-heading"><h2>Журнал подтверждений</h2><span>'+state.history.length+' событий</span></div>'+
      (rows?'<div class="table-wrap"><table class="data-table"><thead><tr><th>Дата</th><th>Действие</th><th>Рекомендация</th><th>Детали</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class="empty-state">Пока нет решений. Откройте любую рекомендацию на главном экране, чтобы проверить сценарий согласования.</div>')+'</section>';
  }
  function openModal(html){$('#modalContent').innerHTML=html;$('#modalOverlay').hidden=false;document.body.style.overflow='hidden';$('#modalClose').focus()}
  function closeModal(){$('#modalOverlay').hidden=true;$('#modalContent').innerHTML='';document.body.style.overflow='';modalRef=null}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3800)}
  function openAction(id){
    const r=makeRecs().find(x=>x.id===id);
    if(!r){toast('Рекомендация уже неактуальна после изменения данных.');return}
    modalRef={kind:'recommendation',id};
    const s=status(id);
    const content='<div class="section-kicker">Рекомендация · '+esc(r.type)+'</div><h2 id="modalTitle">'+esc(r.title)+'</h2><p>'+esc(r.reason)+'</p>'+
      '<div class="modal-details"><div class="detail"><small>Потенциал за 7 дней</small><strong class="accent">+'+money(r.effect)+'</strong></div><div class="detail"><small>Качество данных</small><strong>'+r.quality+'/100</strong></div><div class="detail"><small>Балл приоритета</small><strong>'+num(r.score)+'</strong></div></div>'+
      '<div class="small-label">Расчёт эффекта</div><div class="rule-math">'+esc(r.formula)+'</div>'+
      '<div class="small-label" style="margin-top:18px">Основания рекомендации</div><div class="source-chips">'+r.sources.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>'+
      '<div class="small-label" style="margin-top:18px">Предлагаемый план</div><p style="color:#e0ebdf;margin-top:5px">'+esc(r.plan)+'</p>'+
      '<div class="note warning">'+esc(r.safety)+' Показанный эффект — расчётный сценарий, не обещание дохода.</div>'+
      '<label class="check-row"><input id="confirmCheck" type="checkbox" '+(s==='approved'?'checked':'')+'> Я проверил(а) основания и понимаю, что это согласование плана без реального действия.</label>'+
      '<div class="modal-actions"><button class="primary-btn" data-confirm="'+id+'">'+(s==='approved'?'Подтвердить повторно':'Подтвердить план')+'</button><button class="outline-btn" data-postpone="'+id+'">Отложить</button>'+(id==='winback'?'<button class="text-btn" data-view-go="customers">Проверить сегмент ↗</button>':'<button class="text-btn" data-edit="'+(id==='card'?'CHE-01':id==='promo'?'VEG-03':'BRD-05')+'">Открыть товар ↗</button>')+'</div>';
    openModal(content);
  }
  function editProduct(id){
    const p=byId(id);if(!p)return;
    modalRef={kind:'product',id};
    openModal('<div class="section-kicker">Редактирование товара · демонстрация</div><h2 id="modalTitle">'+esc(p.name)+'</h2><p>Изменения локальные. После сохранения помощник пересчитает приоритеты.</p><form id="editProductForm">'+
      '<div class="grid-two"><div><label class="form-label" for="pPrice">Цена, ₽</label><input class="form-input" id="pPrice" type="number" min="1" max="1000000" value="'+p.price+'" required></div><div><label class="form-label" for="pCost">Себестоимость, ₽</label><input class="form-input" id="pCost" type="number" min="0" max="1000000" value="'+p.cost+'" required></div></div>'+
      '<div class="grid-two"><div><label class="form-label" for="pDiscount">Скидка, %</label><input class="form-input" id="pDiscount" type="number" min="0" max="80" value="'+p.discount+'" required></div><div><label class="form-label" for="pStock">Остаток, шт.</label><input class="form-input" id="pStock" type="number" min="0" max="100000" value="'+p.stock+'" required></div></div>'+
      '<div class="grid-two"><div><label class="form-label" for="pImages">Количество фотографий</label><input class="form-input" id="pImages" type="number" min="0" max="20" value="'+p.images+'" required></div><div><label class="form-label" for="pAttrs">Заполнено обязательных характеристик из 5</label><input class="form-input" id="pAttrs" type="number" min="0" max="5" value="'+p.attrs+'" required></div></div>'+
      '<label class="check-row" style="margin-top:21px"><input id="pDesc" type="checkbox" '+(p.description?'checked':'')+'> У товара есть проверенное описание</label>'+
      '<div class="modal-actions"><button type="submit" class="primary-btn">Сохранить демоданные</button><button type="button" class="outline-btn" data-close="1">Отмена</button></div></form>');
  }
  function saveProduct(e){
    e.preventDefault();
    if(!modalRef||modalRef.kind!=='product')return;
    const p=byId(modalRef.id);
    const fields=[['price','pPrice'],['cost','pCost'],['discount','pDiscount'],['stock','pStock'],['images','pImages'],['attrs','pAttrs']];
    fields.forEach(([key,el])=>p[key]=Number($('#'+el).value));
    p.description=$('#pDesc').checked;
    log('Изменены демоданные',p.name,'Цена, скидка, остаток или готовность карточки');
    closeModal();render();toast('Данные сохранены. Рекомендации пересчитаны.');
  }
  function approve(id){
    if(!$('#confirmCheck')?.checked){toast('Сначала подтвердите, что вы проверили основания.');return}
    const r=makeRecs().find(x=>x.id===id);if(!r)return;
    state.decisions[id]='approved';log('План подтверждён',r.title,'Без исполнения: никакие данные платформы не изменены');
    closeModal();render();toast('План одобрен. Внешние действия не выполнялись.');
  }
  function postpone(id){const r=makeRecs().find(x=>x.id===id);if(!r)return;state.decisions[id]='postponed';log('Отложено',r.title,'Пользователь отложил действие');closeModal();render();toast('Рекомендация отложена.')}
  function navigate(next){if(!$('#view-'+next))return;view=next;render();closeModal();window.scrollTo({top:0,behavior:'smooth'});$('.sidebar').classList.remove('mobile-open')}
  function exportReport(){
    const data={project:'Своё Родное — ИИ-помощник роста фермера',type:'synthetic_demo',generated_at:new Date().toISOString(),period_days:30,products:state.products,customers:state.customers,recommendations:makeRecs(),approvals:state.decisions,history:state.history,method:'score=potential_margin_7d*data_quality*urgency-effort; quality is heuristic, not probability',safety:'No external actions are performed'};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='svoe-rodnoe-demo-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);toast('Демонстрационный отчёт скачан.');
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.dataset.view)navigate(t.dataset.view);
    else if(t.dataset.viewGo)navigate(t.dataset.viewGo);
    else if(t.dataset.open)openAction(t.dataset.open);
    else if(t.dataset.edit)editProduct(t.dataset.edit);
    else if(t.dataset.confirm)approve(t.dataset.confirm);
    else if(t.dataset.postpone)postpone(t.dataset.postpone);
    else if(t.dataset.close)closeModal();
  });
  document.addEventListener('submit',e=>{if(e.target.id==='editProductForm')saveProduct(e)});
  $('#modalClose').addEventListener('click',closeModal);
  $('#modalOverlay').addEventListener('click',e=>{if(e.target.id==='modalOverlay')closeModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modalOverlay').hidden)closeModal()});
  $('#exportData').addEventListener('click',exportReport);
  $('#mobileMenuButton').addEventListener('click',()=>$('.sidebar').classList.toggle('mobile-open'));
  $('#resetDemo').addEventListener('click',()=>{if(!confirm('Сбросить все изменения и решения в этом браузере?'))return;state=seed();persist();navigate('today');toast('Демоданные восстановлены.')});
  render();
})();
