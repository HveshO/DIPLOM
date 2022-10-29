var express = require('express');//для WEB приложения
const bodyParser = require('body-parser');//для получения переменных из HTML формы
const dotenv = require('dotenv').config();
const path = require('path');
const port = process.env.PORT||3000;
var cookieParser = require('cookie-parser');
var app=express();
var session = require('express-session')
app.use(express.static(`${__dirname}/public`));
app.set('view engine','ejs');//подключение ejs, по умолчанию файл ejs должен быть в views
app.use(cookieParser());
const db=require('./db');//подключает базу
const sendMail=require('./mail.js');//подключает базу
const { load } = require('nodemon/lib/config');
const { any } = require('./db');
 //app.set('trust proxy', 1)
// // trust first proxy

// app.use( session({
//   secret: 'you secret key',
//   saveUninitialized: true,
// }))
var session = require('express-session');
const { send } = require('process');
// //CREATE TABLE "session" (
//   "sid" varchar NOT NULL COLLATE "default",
//   "sess" json NOT NULL,
//   "expire" timestamp(6) NOT NULL
// )
// WITH (OIDS=FALSE);

// ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

// CREATE INDEX "IDX_session_expire" ON "session" ("expire");

app.use(session({
  // store: new (require('connect-pg-simple')(session))({
  //   pool : db,                // Connection pool
  //   //tableName : 'user_sessions'
  // }),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  //cookie: { secure: true }
  //store: new (require('connect-pg-simple')(session))({db}),
  //store: new pgSession(pgStoreConfig),
  //secret: process.env.FOO_COOKIE_SECRET,
  //resave: false,
  cookie: { maxAge: 1 * 24 * 60 * 60 * 1000 } // 1 days
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/vihod', (req,res) => {
  // console.log('get/vihod')
  req.session.destroy();
  res.redirect('/');//подключение HTML
});
app.get('/', (req,res) => {
  // console.log('get/')
  res.render('vhod', {
    errors: {
      msg: ''
    },
    choice_role: false
  })
});
app.post('/', function(req, res) {
  // console.log('post/')
  // console.log (req.body)
  let choice=req.body['roles'];
  // console.log('choice',choice)
  req.session.users_id=req.session.users_id;
  // console.log('req.session.users_id',req.session.users_id)
  // console.log('req.sessionID',req.sessionID)
    var login1=req.body.login;
    var passw1=req.body.password;
    db.any("select * from users where login=($1) and passwords = ($2)",[login1,passw1])
    .then(rows => {
      // console.log('rows', rows)
         if (rows.length<1 && choice==undefined) {//пользователь не найден
            res.render('vhod', {
                data: req.body,
                errors: {
                  msg: 'Неправильный пароль или логин'
                },
                choice_role: false
              })
        }
        else {
          if (rows.length>0) {
            req.session.roles=rows[0].roles
            req.session.users_id= rows[0].users_id;
            // console.log('rows[0].roles',rows[0].roles)
          if ((rows[0].roles.length>1 ||rows[0].roles=="главный администратор") && choice==undefined) {//несколько ролей
            if (rows[0].roles=="главный администратор"){
              var choice_roles=["студент","преподаватель","администратор"]
            }
            else {
              var choice_roles=rows[0].roles
            }
            // console.log('rows[0].role.length>1',choice_roles)
            // console.log('rows[0].users_id',rows[0].users_id)
            // console.log('req.session.users_id2',req.session.users_id)
            // console.log(rows[0].roles.length)
            res.render('vhod', {
              data: req.body,
              errors: {
                msg: ''
              },
              choice_role: {
              roles: choice_roles
            }})}
            // console.log('dfkjgkjgerrr')
          if (rows.length>0 &&rows[0].roles.length==1 && rows[0].roles!="главный администратор"){
            // console.log('условие единичное')
            req.session.users_id= rows[0].users_id;
            req.session.roles=rows[0].roles
            // console.log('rows[0].users_id',rows[0].users_id)
            // console.log('req.session.users_id2',req.session.users_id)
            // console.log(rows[0].roles.length)
          choice=rows[0].roles[0]; 
        }         
        }}
    //     console.log('choice',choice,rows.length)
    // console.log('req.session.users_id2',req.session.users_id)
        if (choice=='администратор') {
          // console.log('администратор')
          //req.session.roles='администратор'
          res.redirect ('/menuadmin');
        }
        else if (choice=='преподаватель') {
          //req.session.roles='преподаватель'
          res.redirect ('/menuprep');
        }
        else if (choice=='студент') {
          // console.log('ctudent')
          //req.session.roles='студент'
          res.redirect ('/menu');
          }
        })
        });
app.get('/regist', (req,res) => {
  // console.log('get/regist')
  db.any("select distinct numgroup from users where numgroup is not null and numgroup!='' order by 1")
  .then(rows => {
    // console.log(rows);
    if (rows.length<1)
    {
      msg='Номера групп отсутствуют, регистрация невозможна'
    }
    else {
      msg=''
    }
    res.render('regist', {
    json: rows,
      msg: msg
  })
  })
});
app.post('/regist', (req,res) => {
  // console.log('post/regist')
  // console.log('req.sessionID',req.sessionID)
  async function prob() {
    // console.log(req.body)
     for (let i of Object.keys(req.body))
       {
            req.body[i]=req.body[i].replace(/\s+/g, ' ').trim()}
            console.log('req.bodyyyyy',req.body)
    var rows=await db.any("select * from users where login=($1) or fio=($2) or email=($3)",[req.body.login,req.body.fio,req.body.email])
    // console.log('rooowwww',rows)
      if (rows.length>0) { 
        var cols=await db.any("select distinct numgroup from users where numgroup is not null and numgroup!='' order by 1")
        // console.log(cols)
        res.render('regist', {
            json: cols,
                msg: 'Такой логин или почта уже существуют'
          })   
    }
    else {
      // console.log(Object.values(req.body).forEach(em=>em.replace(/\s+/g, ' ').trim()))
      var users_id= await db.query('insert into users (fio, numgroup,login,passwords,email,roles) values ($1:csv,$2) returning users_id' ,  [Object.values(req.body),['студент']] );
      req.session.users_id=users_id[0].users_id
      req.session.roles=['студент']
      res.redirect('/menu');
    }
}
prob()
});
app.get('/menu', (req,res) => {
  // console.log('get/menu')
    //  req.session.users_id=1
    //  req.session.roles='главный администратор'
  async function prob() {
  if (req.session.users_id==undefined){
    res.send('Для доступа войдите в систему')
  }
  // console.log('req.session.users_idd',req.session.users_id);
  if (req.session.roles!=undefined) {
  if (req.session.roles.includes('главный администратор')){
    var rows=await db.any(`select disc_id,name_disc from discipline order by disc_id`)
  }
  else {
  var rows=await db.any("select disc_id,name_disc from discipline where access_student@> ARRAY[($1)]::bigint[]",[req.session.users_id])
  }
      res.render('menu',{
      id: req.session.users_id,
      json: rows
});}}
prob();
});
app.get('/menu/PersonalArea', (req,res) => {
  // console.log('get/menu/PersonalArea')
  async function prob() {
  var user_id=req.session.users_id;
  // console.log(user_id)
  if (user_id!=undefined){
    //(select name_disc from discipline where access_student@> ARRAY[($1)]::bigint[]) as name_disc
    var rows=await db.any(`select fio,numgroup,email,roles
    from users where users_id=($1)`,[user_id])
    // console.log(rows)
    // console.log(rows[0][2])
    if (rows.length>0){
      res.render('PersonalArea.ejs',{
        zagol: ['ФИО','Номер группы','email','Роли'],
        rows: rows,
        t: undefined
      });
    }
    else {
      res.send('Пользователь не найден')
    }
  }
  else{
  res.send('Для доступа войдите в систему')
}}
prob();
  });
  app.post('/menu/PersonalArea', (req,res) => {
    // console.log('post/menu/PersonalArea')
    async function prob() {
    var user_id=req.session.users_id;
    // console.log('req.body',req.body)
    // console.log(user_id)
      var row=await db.any("select login,passwords from users where (users_id=($1) and login=($2) and passwords=($3))",[user_id, req.body["login"], req.body["password"]])
      if (row.length>0) {
        var prov=await db.any("select login,passwords from users where login=($1) and not (users_id=($2))",[req.body["newlogin"],user_id])
        if (prov.length>0) {
          var rows=await db.any(`select fio,numgroup,email,roles
          from users where users_id=($1)`,[user_id])
          res.render('PersonalArea',{
            zagol: ['ФИО','Номер группы','email','Роли'],
            rows: rows,
            t: 'Логин зарезервирован'
          });
        }
        else {
        var rows=await db.query(`UPDATE users set (login,passwords)=($1,$2) where users_id=($3) returning fio,numgroup,email,roles`,[req.body["newlogin"], req.body["newpassword"],user_id])
        res.render('PersonalArea',{
          zagol: ['ФИО','Номер группы','email','Роли'],
          rows: rows,
          t: 'Логин и пароль успешно обновлены'
        });}}
      else {
        var rows=await db.any(`select fio,numgroup,email,roles
        from users where users_id=($1)`,[user_id])
        // Доступные дисциплины
      res.render('PersonalArea.ejs',{
        zagol: ['ФИО','Номер группы','email','Роли'],
        rows: rows,
        t: 'Неверный логин или пароль'
      });
    }
      }
      if (req.session.users_id==undefined){
        res.send('Для доступа войдите в систему')
      }
      else {
  prob()
}
    });
app.get('/menu/ChoiceTest', (req,res) => {
  // console.log('get/menu/ChoiceTest')
  async function prob() {
  if (req.session.users_id==undefined){
    res.send('Для доступа войдите в систему')
  }
  else if (req.query.disc_id==undefined ||req.query.disc_id=="")
    {
      res.send('Дисциплина отсутствует')
    }
  else {
    if (req.session.roles!=undefined) {
    if (req.session.roles.includes('главный администратор')){
 var rows=await db.any("select disc_id from discipline where disc_id=($1)",[req.query.disc_id])}
 else {
 var rows=await db.any("select disc_id from discipline where access_student@> ARRAY[($1)]::bigint[] and disc_id=($2)",[req.session.users_id,req.query.disc_id])}
      // console.log(rows)
      if (rows.length<1) {
      res.send('Дисциплина отсутствует или недоступна')
    }
    else {
res.render('ChoiceTest.ejs',
  {
    disc_id: req.query.disc_id,
  })
    }
    }
  }}
  prob();
});
app.get('/menu/ChoiceTest/demoversion', (req,res) => {
  // console.log('get/menu/ChoiceTest/demoversion')
  // console.log(req.query.disc_id)
  //req.session.users_id=83
  async function prob() {
  if (req.session.users_id==undefined){
    res.send('Для доступа войдите в систему')
  }
  else if (req.query.disc_id==undefined ||req.query.disc_id=="")
    {
      res.send('Дисциплина отсутствует')
    }
  else if (req.session.roles!=undefined) {
  if (req.session.roles.includes('главный администратор')){
    var rows=await db.any("select disc_id from discipline where disc_id=($1)",[req.query.disc_id])}
    else {
  var rows = await db.any("select disc_id from discipline where access_student@> ARRAY[($1)]::bigint[] and disc_id=($2)",[req.session.users_id,req.query.disc_id])}
    // console.log(rows)
    if (rows.length<1) {
    res.send('Дисциплина отсутствует или недоступна')
  }
  else {
  var disc_id=req.query.disc_id;
  var users_id=req.session.users_id
  var msg=''
  var row = await db.any('SELECT name_disc,attempt_demo from discipline where disc_id=($1);',disc_id)
  name_d=row[0].name_disc;
  var att = await db.any('SELECT attempt from table_score where disc_id=($1) and users_id=($2) and test=($3);',[disc_id, users_id,'demo'])
    if (Object.keys(att).length!=0){ 
      // console.log('att',att[0].attempt)
    if (Number(att[0].attempt)>=Number(row[0].attempt_demo) &&att[0].attempt!=undefined){
      msg='Тест недоступен'
    }
  }
  //console.log('tjtkjt',name_d);
  // console.log('msg',msg)
    var rows= await db.any('SELECT * from table_demo where disc_id=($1) order by table_id;',disc_id)
      if (rows.length<1) {
        msg='В тесте нет вопросов'
      }
        res.render('test', {
          json: rows,
          name_d: name_d,
          msg: msg
  })}}}
  prob();
})
app.post('/menu/ChoiceTest/demoversion', function(req, res) {
  // console.log('post/menu/ChoiceTest/demoversion')  
  //console.log(req.body)
  var disc_id=req.query.disc_id
  var users_id=req.session.users_id
  db.any('SELECT name_disc from discipline where disc_id=($1);',disc_id)
  .then(row => { name_d=row[0].name_disc;
  return name_d})
  async function prob() {
   await db.any("delete from table_answer where users_id=($1) and test=($2) and disc_id=($3)",[users_id,"demo",disc_id]);
  var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
  for (let i = 0; i < keyss.length; i++)
      {
        // console.log('req.body[keyss[i]]',req.body[keyss[i]])
        if (Array.isArray(req.body[keyss[i]])){
          for (let j = 0; j < req.body[keyss[i]].length; j++) {
            req.body[keyss[i]][j]=req.body[keyss[i]][j].replace(/\s+/g, ' ').trim()
          }
        }
        else{
        req.body[keyss[i]]=req.body[keyss[i]].replace(/\s+/g, ' ').trim()
        req.body[keyss[i]]='{'+String(req.body[keyss[i]])+'}'}
        db.any("insert into table_answer (table_id,disc_id,test, users_id,answer) values ($1,$2,$3,$4,$5)", 
        [Number(Object.keys(req.body)[i]),disc_id,"demo",users_id,req.body[keyss[i]]]);
      }
     await db.any(`UPDATE table_answer 
  set point = points
  from (SELECT table_demo.table_id,table_demo.disc_id,case
  when type_q='text'
  then case when string_to_array(lower(array_to_string(answer, ',','')),',','') <@ string_to_array(lower(array_to_string(right_q,',','')),',','')
    then table_demo.point
    else 0 
    end
  else case when answer=right_q
    then table_demo.point
    else 0
    end
  end as points
  from public.table_answer,public.table_demo
  where test='demo' and table_answer.table_id=table_demo.table_id
  and table_answer.disc_id=table_demo.disc_id and users_id=($1)) as table_demo
  where test='demo' and table_answer.table_id=table_demo.table_id
  and table_answer.disc_id=table_demo.disc_id and users_id=($1);`,[users_id])
  await db.any('select table_id,point from table_answer;')
  .then(rows=> {
    // console.log('rowfhyree',rows)
  })
  await db.query('select attempt from table_score where disc_id=($1) and test=($2) and users_id=($3)',[disc_id,'demo',users_id]).catch( error=>console.log(error))
    .then(rows => {
    if (Object.keys(rows).length!=0){
      attempt=Number(rows[0].attempt)+1
      db.query('delete from  table_score where disc_id=($1) and test=($2) and users_id =($3)',[disc_id,'demo',users_id]).catch( error=>console.log(error))
    }
    else {
      attempt=1
    }
    //console.log([disc_id,id,'demo',attempt+1])
    db.query(`insert into table_score (disc_id, users_id, test,attempt,final_score, max_score, per_score)
    SELECT $1,$2,$3,$4, sum(table_answer.point) as final_score,sum(table_demo.point) as max_score, 
    round(round(sum(table_answer.point),10)/round(sum(table_demo.point),10),2)*100 as per_score
    from public.table_answer,public.table_demo
    where test=($3) and table_answer.table_id=table_demo.table_id
    and table_answer.disc_id=table_demo.disc_id and users_id=($2)
    group by users_id`,[disc_id,users_id,'demo',attempt]);
  })
// } prob()
//   async function proba2 () {
  await db.query(`select name_q,text_q,variants,answer,right_q,table_answer.table_id,type_q,table_answer.point as points,table_demo.point as point
  from public.table_answer,public.table_demo
  where test=($2) and table_answer.table_id=table_demo.table_id
  and table_answer.disc_id=table_demo.disc_id and users_id=($3) and table_demo.disc_id=($1) order by table_id`,[disc_id,'demo',users_id])
  .then(rows =>{
   //console.log('прошло успешно',rows,'прошло успешно');
  
      // console.log('прошло успешно',rows,'прошло успешно');
   db.any('select final_score, max_score, per_score,grade from table_score where disc_id=$1 and test=$2 and users_id=$3',[disc_id,'demo',users_id])
    .then(score =>{
       console.log('прошло успешноettt2',score);
      res.render('demoresult', {
         json: rows,
         name_d: name_d,
         score: score,
       })
      })
   
     })
    
    } prob()})
app.get('/menu/ChoiceTest/ekzamen', (req,res) => {
  // console.log('get/menu/ChoiceTest/ekzamen')
  // console.log(req.query.disc_id,req.session.roles,req.session.users_id)
  async function prob() {
  if (req.session.users_id==undefined){
    res.send('Для доступа войдите в систему')
  }
  else if (req.query.disc_id==undefined ||req.query.disc_id=="")
    {
      res.send('Дисциплина отсутствует')
    }
  if (req.session.roles!=undefined) {
  if (req.session.roles.includes('главный администратор')){
    var rows=await db.any("select disc_id from discipline where disc_id=($1)",[req.query.disc_id])}
    else {
  var rows = await db.any("select disc_id from discipline where access_student@> ARRAY[($1)]::bigint[] and disc_id=($2)",[req.session.users_id,req.query.disc_id])}
    // console.log(rows)
    if (rows.length<1) {
    res.send('Дисциплина отсутствует или недоступна')
  }
  else {
  var disc_id=req.query.disc_id;
  var id=req.session.users_id;
  // console.log(req.query.disc_id,req.session.users_id)
    var msg=''
    var row=await db.any('SELECT name_disc,attempt_ekz from discipline where disc_id=($1);',disc_id) 
    // console.log('row',row)
    var att=await db.any('SELECT attempt from table_score where disc_id=($1) and users_id=($2) and test=($3);',[disc_id, id,'ekz'])
     //console.log(att[0].attempt)
      if (Object.keys(att).length!=0){  
        // console.log('ejrjerh',att[0].attempt)
      if (Number(att[0].attempt)>=Number(row[0].attempt_ekz) &&att[0].attempt!=undefined){
        msg='Тест недоступен'
      }
      // console.log('att',att[0].attempt,msg)
    }
    // console.log('att',msg)
      var name_d=row[0].name_disc;
  // console.log('tjtkjt',name_d);
  var rows=await db.any('SELECT * from table_ekz where disc_id=($1) order by table_id;',disc_id)
      if (rows.length<1) {
        msg='В тесте нет вопросов'
      }
      // console.log('rows',rows)
        res.render('test', {
          json: rows,
          name_d: name_d,
          msg: msg
        })
      }}}
        prob();
});
app.post('/menu/ChoiceTest/ekzamen', function(req, res) {
  // console.log('post/menu/ChoiceTest/ekzamen')
  // console.log(req.body)
  // console.log(req.session.users_id)
  // console.log(req.session.users_id)
  async function prob() {
    var disc_id=req.query.disc_id
    var users_id=req.session.users_id
    if (users_id==undefined)
    {
      users_id=null
    }
    // console.log('users_id',users_id)
    // console.log(disc_id)
    var row=await db.any('SELECT name_disc from discipline where disc_id=($1);',disc_id)
    // console.log(row)
    try{
    var name_d=row[0].name_disc;
    } catch{
      res.send('Дисциплина отсутствует')
    }
   await db.any("delete from table_answer where users_id=($1) and test=($2) and disc_id=($3)",[users_id,"ekz",disc_id]);//и для экза тоже
  var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
  for (let i = 0; i < keyss.length; i++)
      {
        if (Array.isArray(req.body[keyss[i]])){
          for (let j = 0; j < req.body[keyss[i]].length; j++) {
            req.body[keyss[i]][j]=req.body[keyss[i]][j].replace(/\s+/g, ' ').trim()
          }
        }
        else{
        req.body[keyss[i]]=req.body[keyss[i]].replace(/\s+/g, ' ').trim()
        req.body[keyss[i]]='{'+String(req.body[keyss[i]])+'}'
      }
      // console.log('req.body[keyss[i]]',req.body[keyss[i]])
        // db.any('select point from public.table_demo where test=($3) and table_id=($1) and disc_id=($2)',[Number(Object.keys(req.body)[i]),disc_id,"demo"])
        // .then (rows=>{rows[0].point=}
        db.any("insert into table_answer (table_id,disc_id,test, users_id,answer) values ($1,$2,$3,$4,$5)", 
        [Number(Object.keys(req.body)[i]),disc_id,"ekz",users_id,req.body[keyss[i]]]);
      }
      // console.log('цуецуе')
     await db.any(`UPDATE table_answer 
  set point = points
  from (SELECT table_ekz.table_id,table_ekz.disc_id,case
  when type_q='text'
  then case when string_to_array(lower(array_to_string(answer, ',','')),',','') <@ string_to_array(lower(array_to_string(right_q,',','')),',','')
    then table_ekz.point
    else 0 
    end
  else case when answer=right_q
    then table_ekz.point
    else 0
    end
  end as points
  from public.table_answer,public.table_ekz
  where test=$2 and table_answer.table_id=table_ekz.table_id
  and table_answer.disc_id=table_ekz.disc_id and users_id=($1)) as table_ekz
  where test=$2 and table_answer.table_id=table_ekz.table_id
  and table_answer.disc_id=table_ekz.disc_id and users_id=($1);`,[users_id,'ekz'])
  // console.log('console.log(цуецуе,req.body[keyss[i]])')
  await db.any('select table_id,point from table_answer;')
  .then(rows=> {console.log('rowfhyree',rows)})
  var rows=await db.query('select attempt from table_score where disc_id=($1) and test=($2) and users_id=($3)',[disc_id,'ekz',users_id]).catch( error=>console.log('rkrr',error))
    if (Object.keys(rows).length!=0){
      attempt=Number(rows[0].attempt)+1
      db.query('delete from table_score where disc_id=($1) and test=($2) and users_id =($3)',[disc_id,'ekz',users_id]).catch( error=>console.log('rkrr',error))
    }
    else {
      attempt=1
    }
    //console.log([disc_id,id,'demo',attempt+1])
    await db.query(`insert into table_score (disc_id, users_id, test,final_score, max_score, per_score)
    SELECT $1,$2,$3, sum(table_answer.point) as final_score,sum(table_ekz.point) as max_score, 
    round(round(sum(table_answer.point),10)/round(sum(table_ekz.point),10),2)*100 as per_score
    from public.table_answer,public.table_ekz
    where test=($3) and table_answer.table_id=table_ekz.table_id
    and table_answer.disc_id=table_ekz.disc_id and users_id=($2)
    group by users_id`,[disc_id,users_id,'ekz']);
    // console.log( 'erlkjtrtjjtjtjtjtjtjttjt',attempt,disc_id,users_id,'ekz')
  await db.query(`UPDATE table_score set attempt=($1) where disc_id=($2) and users_id=($3) and test=($4)`,[attempt,disc_id,users_id,'ekz'])
  var rows=await db.query(`select name_q,text_q,variants,answer,right_q,table_answer.table_id,type_q,table_answer.point as points,table_ekz.point as point
  from public.table_answer,public.table_ekz
  where test=($2) and table_answer.table_id=table_ekz.table_id
  and table_answer.disc_id=table_ekz.disc_id and users_id=($3) and table_ekz.disc_id=($1) order by table_id`,[disc_id,'ekz',users_id])
  db.any('select final_score, max_score, per_score,grade from table_score where disc_id=$1 and test=$2 and users_id=$3',[disc_id,'ekz',users_id])
    .then(score =>{
      // console.log('прошло успешноettt2',score);
      res.render('demoresult1', {
         json: rows,
         name_d: name_d,
         score: score,
       })
      })
}
prob()
})
app.get('/menuadmin', (req,res) => {
  // console.log('get/menuadmin');
  if (req.session.users_id==undefined){
    res.send('Для доступа войдите в систему')
  }
  else if (req.session.roles!=undefined) {
  if (!req.session.roles.includes('администратор')&&!req.session.roles.includes('главный администратор')){
    res.send('Недостаточно прав')
    // console.log('req.session.roles',req.session.roles)
    }
  else{

  res.sendfile('public/menuadmin.html');}}
    });
app.get('/menuadmin/RedactUsers', function(req, res) {
      // console.log('get/menuadmin/RedactUsers')
       column=['ФИО','Логин','Пароль','Номер группы','Роли','email']
       type=['fio','login','passwords','numgroup','roles','email']
      if (req.session.users_id==undefined){
        res.send('Для доступа войдите в систему')
      }
      else if (req.session.roles!=undefined) {
       if (!req.session.roles.includes('администратор') &&!req.session.roles.includes('главный администратор')){
        res.send('Недостаточно прав')
        // console.log('req.session.roles',req.session.roles)
        }
      else{
      db.any("select fio,login,passwords,numgroup,roles,email from users order by users_id")
        .then(rows => {
          // console.log(rows)
          // r=Object.keys(rows[0])
          // console.log(r)
          // column=r;
          // type=r;
          //console.log(rows[1][Object.keys(rows[1])[-1]])
          res.render('Users.ejs',{
            zagol: column,
            json: rows,
            type: type,
            t: undefined
          })})
         }}     
            });
app.post('/menuadmin/RedactUsers', function(req, res) {
  // console.log('post/menuadmin/RedactUsers')
  //     console.log(req.body)
      async function prob() {
      var column=['ФИО','Логин','Пароль','Номер группы','Роли','email']
      var type=['fio','login','passwords','numgroup','roles','email']
      var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
      let fios=[];
      let logins=[];
      let emails=[];
  for (let i = 0; i < keyss.length; i++)
      {
        if (keyss[i]!='checkmain'){
          for (let j = 0; j < req.body[keyss[i]].length; j++) {
            req.body[keyss[i]][j]=req.body[keyss[i]][j].replace(/\s+/g, ' ').trim()
          }
          req.body[keyss[i]][4]='{'+req.body[keyss[i]][4]+'}'
        // console.log(req.body[keyss[i]])
        //WHERE fio=($2) OR login=($3) OR email=($4);
        let q2 =await db.any("UPDATE users SET (fio,login,passwords,numgroup,roles,email) = ($1:csv) WHERE fio=($2) OR login=($3) OR email=($4) RETURNING users_id;",
        [req.body[keyss[i]],req.body[keyss[i]][0],req.body[keyss[i]][1],req.body[keyss[i]][5]])
        // console.log('q2',q2)
        if (q2.length<1)
        { 
          // console.log('rtjkrjtkrj')
          await db.any("insert into users (fio,login,passwords,numgroup,roles,email) values ($1:csv)",
        [req.body[keyss[i]]])
        }
        fios.push(req.body[keyss[i]][0]);
        logins.push(req.body[keyss[i]][1]);
        emails.push(req.body[keyss[i]][5]);
           }}
        // console.log(fios,logins,emails)
        // console.log('fios',fios)
        // console.log('emails',emails)
           var delusers=await db.any("delete from users where (not fio =ANY(($1)) or not login=ANY(($2)) or not email=ANY(($3))) RETURNING users_id;",[fios,logins,emails])
          //  console.log('delusers',delusers)
          //  dell=[ { users_id: '72' }, { users_id: '73' } ]
           delusers=delusers.map((num) => Number(num.users_id))
          //  console.log(dell)
           await db.any("delete from table_answer where users_id =ANY(($1)) RETURNING users_id;",[delusers])
           await db.any("delete from table_score where users_id =ANY(($1)) RETURNING users_id;",[delusers])
           //-------------------------------Отправка email------------------------
           //var rows=await db.any("select fio,numgroup,email from users order by users_id")
           //console.log('rowsprov',rows)
           var checkmain=req.body['checkmain'];
          //  console.log('checkmain',checkmain)
           var tet=undefined;
           if (checkmain!=undefined)
              {
           for (let i of checkmain){
            // console.log(' req.body[i][2]',req.body[i][5])
            let t=await db.any("select login,passwords from users where email=($1)",[req.body[i][5]])
            // console.log('t',Object.values(t[0]))
            // console.log(Object.values(t[0])[0])

            try{
              var success=sendMail(req.body[i][5],Object.values(t[0])[0],Object.values(t[0])[1]);
              // console.log('Cупергуд',req.body[i][5],Object.values(t[0])[0],Object.values(t[0])[1])
              if (!success)
              {
                // console.log('Ошибка отправки')
              // console.log('t',Object.values(t[0]),req.body[i][5],Object.values(t[0])[1])
              res.render('Users.ejs',{
                zagol: column,
                json: rows,
                type: type,
                t: 'Ошибка отправки логина и пароля на почту:'+Object.values(t[0])[1]
              })
              }
              }
              catch {
              //  console.log('Ошибка отправки')
              // console.log('t',Object.values(t[0]),req.body[i][5],Object.values(t[0])[1])
              res.render('Users.ejs',{
                zagol: column,
                json: rows,
                type: type,
                t: 'Ошибка отправки логина и пароля на почту:'+Object.values(t[0])[1]
              })
             }
           }
         tet='Емэйлы успешно отправлены'
       }
        var rows=await db.any("select fio,login,passwords,numgroup,roles,email from users order by users_id")

          // r=Object.keys(rows[0])
          // console.log(r)
          // column=r;
          // type=r;
          // console.log('Ну давай допустим')
          res.render('Users.ejs',{
            zagol: column,
            json: rows,
            type: type,
            t: tet
          })
        }
            prob();    
          });
// app.get('/menuadmin/RedactNumgroup', function(req, res) {
//   console.log('kdjfkrheirh')
//   db.any('SELECT numgroup from numgroups;')
//     .then(rows => {
//       console.log(rows);
//       console.log('dsjgjfdh');
//       res.render('RedactNumgroup', {
//         json: rows })     
//           })     
//         });
// app.post('/menuadmin/RedactNumgroup', function(req, res) {
//   console.log('log body');
//   console.log(req.body);
//   db.any("delete from numgroups numgroup;") 
//   console.log(Object.values(req.body))
//   for (let i = 0; i < Object.keys(req.body).length; i++) {
//     console.log(Object.values(req.body)[i])
//     if (Object.values(req.body)[i]!= []){
//     db.query("insert into numgroups (numgroup) values ($1);", [Object.values(req.body)[i]]);
//     }        
//   }
//   db.any('SELECT numgroup from numgroups;')
//   .then(rows => {
//     console.log(rows);
//     console.log('dsjgjfdh');
//     res.render('RedactNumgroup', {
//       json: rows })     
//         })  
// }); 
app.get('/menuadmin/RedactDiscipline', function(req, res) {
  // console.log('get/menuadmin/RedactDiscipline')
  // req.session.users_id=2
  //   req.session.roles='администратор'
  column=['Дисциплина']
  //,'number_array'
  type=['text']
  if (req.session.users_id==undefined){
    res.send('Для доступа войдите в систему')
  }
  else if (req.session.roles!=undefined) {
  if (!req.session.roles.includes('администратор')&&!req.session.roles.includes('главный администратор')){
    res.send('Недостаточно прав')
    // console.log('req.session.roles',req.session.roles)
    }
  else{
    db.query('SELECT disc_id,name_disc from discipline order by disc_id;')
    .then(rows => {
      // console.log(rows)
      res.render('RedactDisciplines', {
        zagol: column,
        json: rows,
        type: type,
        t: undefined
      })     
      })     
    }}
  });
app.post('/menuadmin/RedactDiscipline', function(req, res) {//я гений тут просто, не шучу
  // console.log('post/menuadmin/RedactDiscipline');
  async function save() {
    try{
    // console.log('req.body',req.body)
    //,'Доступ по id пользователям'
    column=['Дисциплина']
    type=['text']
    let discipline=[];
    var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
for (let i = 0; i < keyss.length; i++)
    { 
        for (let j = 0; j < req.body[keyss[i]].length; j++) {
          req.body[keyss[i]][j]=req.body[keyss[i]][j].replace(/\s+/g, ' ').trim()
          if (req.body[keyss[i]][j]==''){
            req.body[keyss[i]][j]=null
          }
        }
        if (req.body[keyss[i]][3]!=null){
          req.body[keyss[i]][3]='{'+req.body[keyss[i]][3]+'}'
        }
    // console.log('req.body[keyss[i]][j]',req.body)
          let q2 =await db.any("UPDATE discipline SET name_disc = ($1) WHERE text(disc_id)=(($2)) RETURNING disc_id;",[Object.values(req.body)[i],Object.keys(req.body)[i]])
      // console.log('q2',q2)
      if (q2.length<1)
      { 
        // console.log('rtjkrjtkrj')
        var disc=await db.any("insert into discipline (disc_id,name_disc) values ($1,$2) returning disc_id;", [Object.keys(req.body)[i],req.body[keyss[i]]]);
        // console.log('устала 2',disc)
      }
      discipline.push(Object.keys(req.body)[i]);
         }
      // console.log('discipline', discipline)
         var delete_disc=await db.any("delete from discipline where not text(disc_id) =ANY(($1)) returning disc_id",[discipline])
        //  console.log('delete_disc',delete_disc)
         if (delete_disc.length>0)
      { 
        // console.log('rtjkrjtkrj')
         delete_disc=delete_disc.map(el=>Number(el['disc_id']))
        //  console.log(' delete_disc', delete_disc)
         await db.any("delete from table_answer where disc_id=ANY(($1))",[delete_disc])
         await db.any("delete from table_demo where disc_id=ANY(($1))",[delete_disc])
         await db.any("delete from table_ekz where disc_id=ANY(($1))",[delete_disc])
         await db.any("delete from table_score where disc_id=ANY(($1))",[delete_disc])
        //  console.log('супергуд')
        }
         var rows=await db.any("SELECT disc_id,name_disc from discipline order by disc_id;")
      // console.log('rowsprov',rows)
      res.render('RedactDisciplines', {
        zagol: column,
        json: rows,
        type: type,
        t: undefined
      })     
    }catch{
      var rows=await db.any("SELECT disc_id,name_disc from discipline order by disc_id;")
      // console.log('rowsprov',rows)
      res.render('RedactDisciplines', {
        zagol: column,
        json: rows,
        type: type,
      t: 'Неправильный ввод данных'
    })}
  }
      //console.log(rows[1][Object.keys(rows[1])[-1]])
      save(); 
  });
app.get('/menuadmin/RedactDiscipline/access', (req,res) => {
  // console.log('get/menuadmin/RedactDiscipline/access')
  // req.session.users_id=2
  //   req.session.roles='администратор'
  async function prov(){
  if (req.session.users_id==undefined){
    res.send('Для доступа войдите в систему')
  }
  else if (req.session.roles!=undefined) {
  if (!req.session.roles.includes('администратор')&&!req.session.roles.includes('главный администратор')){
    res.send('Недостаточно прав')
    // console.log('req.session.roles',req.session.roles)
    }
    
    else if (req.query.disc_id==undefined ||req.query.disc_id=="")
    {
      res.send('Дисциплина отсутствует')
    }
    else {
      var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
      if (name_disc.length<1)
      {
        res.send('Дисциплина отсутствует')
      }
      else{
    var json=await db.any(`select users_id,fio,login,passwords,email from users where roles@> ARRAY['преподаватель']`)
    var access=await db.any(`select access_teacher from discipline where disc_id=($1)`,[req.query.disc_id])
    // console.log(json,access)
    // console.log(json[0][Object.keys(json[0])[0]],access.includes(Number(json[0][Object.keys(json[0])[0]])))
    res.render('Access.ejs',
    {
      name_d: name_disc[0].name_disc,
      json:json,
      zagol: ['ФИО','Логин','Пароль','email'],
      access: access[0].access_teacher
    })}
  }}}
    prov();
  });
  app.post('/menuadmin/RedactDiscipline/access', (req,res) => {
    // console.log('post/menuadmin/RedactDiscipline/access')
    // console.log(req.body.checkmain)
    //.map((num) => Number(num.users_id))

    async function prov(){
        var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
      var json=await db.any(`select users_id,fio,login,passwords,email from users where roles@> ARRAY['преподаватель']`)
      if (!Array.isArray(req.body.checkmain)){
        // console.log('я устала')
        access=await db.any(`UPDATE discipline SET access_teacher = ARRAY[($1):: bigint] WHERE disc_id=($2) returning access_teacher`, [req.body.checkmain,req.query.disc_id])
      }
      else {
        access=await db.any(`UPDATE discipline SET access_teacher = ($1):: bigint[] WHERE disc_id=($2) returning access_teacher`, [req.body.checkmain,req.query.disc_id])
      }
      res.render('Access.ejs',
      {
        name_d: name_disc[0].name_disc,
        json:json,
        zagol: ['ФИО','Логин','Пароль','email'],
        access: access[0].access_teacher
      })
    }
      prov();
    });
app.get('/menuadmin/RedactDiscipline/choicetest', (req,res) => {
  // console.log('get/menuadmin/RedactDiscipline/choicetest')

  if (req.session.users_id==undefined){
    res.send('Для доступа войдите в систему')
  }
  else if (req.session.roles!=undefined) {
  if (!req.session.roles.includes('администратор')&&!req.session.roles.includes('главный администратор')){
    res.send('Недостаточно прав')
    // console.log('req.session.roles',req.session.roles)
    }
    else if (req.query.disc_id==undefined){
      res.send('Дисциплина отсутствует')
      }
  else{
    res.render('ChoiceTestadmin.ejs',
    {
      disc_id: req.query.disc_id
    })}}
  });
app.get('/menuadmin/RedactDiscipline/choicetest/RedactTest', function(req, res) {
  // console.log('get/menuadmin/RedactDiscipline/choicetest/RedactTest')
  async function prov(){
    // req.session.users_id=2
    // req.session.roles='администратор'
    if (req.query.disc_id==undefined ||req.query.disc_id==""||(req.query.test!='demo'&& req.query.test!='ekz')){
      res.send('Дисциплина отсутствует')
    }
    else {
    if (req.session.users_id!=undefined){
      // console.log('что за хрень')
      var row=await db.any(`select access_teacher from discipline where disc_id=($1) and ($2)=ANY(access_teacher)`,[Number(req.query.disc_id),Number(req.session.users_id)])
      //console.log(row,req.session.users_id,!req.session.roles.includes('администратор')|| row.length<1)
    }
  if (req.session.users_id==undefined){
    res.send('Для доступа войдите в систему')
  }
  else if (req.session.roles!=undefined) {
  if (!req.session.roles.includes('администратор')&& row.length<1 &&!req.session.roles.includes('главный администратор')){
    res.send('Недостаточно прав')
    // console.log('req.session.roles',req.session.roles)
    }
  else{
  var test=req.query.test;
  var disc_id=req.query.disc_id
  // console.log(disc_id)
  if (test=='demo')
  {
    table='table_demo';
  }
  else {
    table='table_ekz';
  }
  var row=await db.any('SELECT name_disc from discipline where disc_id=($1);',[req.query.disc_id])
    try{
      var name_d=row[0].name_disc;
      } catch{
        res.send('Дисциплина отсутствует')
      }
  // console.log('tjtkjt',name_d);
    var rows=await db.any('SELECT * from '+table+' where disc_id=($1) order by table_id;',[disc_id])
      // console.log('rows',rows)
        res.render('RedactTest', {
          json: rows,
          name_d: name_d
    })}}}}
    prov();
})
app.post('/menuadmin/RedactDiscipline/choicetest/RedactTest', function(req, res) {
  // console.log('post/menuadmin/RedactDiscipline/choicetest/RedactTest')

  async function save() {
    var test=req.query.test;
    var disc_id=req.query.disc_id
  // console.log(req.body)
  if (test=='demo')
  {
    table='table_demo';
  }
  else {
    table='table_ekz';
  }
  /// {1,}[ ^\r]|\t/g
  // console.log('table',table)
  var keyss=Object.keys(req.body);
  for (let i = 0; i < keyss.length; i++)
      { 
        // console.log('req.body[fhfhfh]',req.body[keyss[i]])
      if (keyss[i].includes('text')||keyss[i].includes('name'))
        {
          req.body[keyss[i]]=req.body[keyss[i]].replace(/ {1,}[ ^\r]|\t/g,' ').trim()
        }
      else {
        if (Array.isArray(req.body[keyss[i]])){
          for (let j = 0; j < req.body[keyss[i]].length; j++) {
            req.body[keyss[i]][j]=req.body[keyss[i]][j].replace(/\s+/g, ' ').trim()
          }
        }
        else{
        req.body[keyss[i]]=req.body[keyss[i]].replace(/\s+/g, ' ').trim()
      }}
      }
  // console.log(req.body);
  await db.any("delete from "+table+" where disc_id=($1)",[disc_id])
  var reqdata=req.body;
  reqkeys=Object.keys(req.body).length
  if (Object.keys(reqdata).length!=0){  
  var keyss=Object.keys(reqdata);
  var m=keyss.filter(word => word.includes ("text_q"))
  var l=[]
  for (let i = 0; i < m.length; i++)
    {
        l[i]=Number(m[i].replace("text_q",""))
        // console.log(l[i])
    }
  for (let i = 0; i < l.length; i++){ 
        if (reqdata['type_q'+l[i]]=="text"){
        reqdata['variants'+l[i]]=[0];
      }
  // console.log('reqdata',reqdata)
    if (Array.isArray(reqdata['right_q'+l[i]])){
        await db.query("insert into "+table+" (disc_id, name_q,text_q,point,type_q,variants,right_q) values ($1,$2,$3,$4,$5,$6,$7);",
         [disc_id, reqdata['name_q'+l[i]],reqdata['text_q'+l[i]],reqdata['point'+l[i]],reqdata['type_q'+l[i]],reqdata['variants'+l[i]],reqdata['right_q'+l[i]]]);
      }
      else {
        reqdata['right_q'+l[i]]='{'+reqdata['right_q'+l[i]]+'}'
        await db.query("insert into "+table+" (disc_id, name_q,text_q,point,type_q,variants,right_q) values ($1,$2,$3,$4,$5,$6,$7);",
         [disc_id, reqdata['name_q'+l[i]],reqdata['text_q'+l[i]],reqdata['point'+l[i]],reqdata['type_q'+l[i]],reqdata['variants'+l[i]],reqdata['right_q'+l[i]]]);
      }
    }
  }
  var row= await db.any('SELECT name_disc from discipline where disc_id=($1);',disc_id) 
    var name_d=row[0].name_disc;
  // console.log('tjtkjt',name_d);
  var rows=await db.any('SELECT * from '+table+' where disc_id=($1) order by table_id;',disc_id)
        res.render('RedactTest', {
          json: rows,
          name_d: name_d
        })
  }
  try{
  save();
}
  catch{
    res.send(404)
  }
});
  app.get('/menuprep', (req,res) => {
    // console.log('get/menuprep')
    // console.log(req.session.users_id,req.session.roles)
    // req.session.users_id=1;
    // req.session.roles="главный администратор"
    async function selectt() {
      column=['Дисциплина','Кол-во попыток \n для экзамена','Кол-во попыток \n пробного теста']
      if (req.session.roles!=undefined) {
      if (req.session.roles.includes('главный администратор')){
        var rows=await db.any(`select disc_id,name_disc,attempt_ekz,attempt_demo from discipline order by disc_id`)
      }
      else {
      var rows=await db.any(`select disc_id,name_disc,attempt_ekz,attempt_demo from discipline where access_teacher @>ARRAY[($1)]::bigint[] order by disc_id`,[req.session.users_id]) 
      }
      // console.log(rows)
        //console.log(rows[1][Object.keys(rows[1])[-1]])
        res.render('PrepDiscipline.ejs',{
          zagol: column,
          json: rows,
        })}}
        if (req.session.users_id==undefined){
          res.send('Для доступа войдите в систему')
        }
        else if (!req.session.roles.includes('преподаватель')&&!req.session.roles.includes('главный администратор')){
          res.send('Недостаточно прав')
          console.log('req.session.roles',req.session.roles)
          }
        else{
        selectt();}
  });
  app.post('/menuprep', (req,res) => {
      // console.log('post/menuprep')
      // console.log(req.body)
    async function prov() {
      var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
    for (let i = 0; i < keyss.length; i++)
      { 
        await db.any("UPDATE discipline SET (attempt_ekz,attempt_demo) = ($1:csv) where name_disc=($2)",[req.body[keyss[i]],keyss[i]])
      }
      if (req.session.roles!=undefined) {
      if (req.session.roles.includes('главный администратор')){
        var rows=await db.any(`select disc_id,name_disc,attempt_ekz,attempt_demo from discipline order by disc_id`)
      }
      else {
      var rows=await db.any(`select disc_id,name_disc,attempt_ekz,attempt_demo from discipline where access_teacher @>ARRAY[($1)]::bigint[] order by disc_id`,[req.session.users_id]) 
      }}
      column=['Дисциплина','Кол-во попыток \n для экзамена','Кол-во попыток \n пробного теста']
      res.render('PrepDiscipline.ejs',{
        zagol: column,
        json: rows,
      })
    }
      prov()
  });
  app.get('/menuprep/PersonalArea', (req,res) => {
    // console.log('get/menuprep/PersonalArea')
    async function prob() {
    var user_id=req.session.users_id;
    // console.log(user_id)
    if (user_id!=undefined){
      var rows=await db.any(`select fio,numgroup,email, roles
      from users where users_id=($1)`,[user_id])
      // console.log(rows)
      // console.log(rows[0][2])
      if (rows.length>0){
        res.render('PersonalArea.ejs',{
          zagol: ['ФИО','Номер группы','email',"Роли"],
          rows: rows,
          t: undefined
        });
      }
      else {
        res.send('Пользователь не найден')
      }
    }
    else{
    res.send('Для доступа войдите в систему')
  }}
  prob();
    });
    app.post('/menuprep/PersonalArea', (req,res) => {
      // console.log('post/menuprep/PersonalArea')
      if (req.session.users_id==undefined){
        res.send('Для доступа войдите в систему')
      }
      async function prob() {
      var user_id=req.session.users_id;
      // console.log('req.body',req.body)
      // console.log(user_id)
        var row=await db.any("select login,passwords from users where (users_id=($1) and login=($2) and passwords=($3))",[user_id, req.body["login"], req.body["password"]])
        if (row.length>0) {
          var prov=await db.any("select login,passwords from users where login=($1) and not (users_id=($2))",[req.body["newlogin"],user_id])
        if (prov.length>0) {
          var rows=await db.any(`select fio,numgroup,email,roles
          from users where users_id=($1)`,[user_id])
          res.render('PersonalArea',{
            zagol: ['ФИО','Номер группы','email','Роли'],
            rows: rows,
            t: 'Логин зарезервирован'
          });
        }
        else {
          var rows=await db.query(`UPDATE users set (login,passwords)=($1,$2) where users_id=($3) returning fio,numgroup,email,roles`,[req.body["newlogin"], req.body["newpassword"],user_id])
          res.render('PersonalArea',{
            zagol: ['ФИО','Номер группы','email','Роли'],
            rows: rows,
            t: 'Логин и пароль успешно обновлены'
          });}}
        else {
          var rows=await db.any(`select fio,numgroup,email,roles
          from users where users_id=($1)`,[user_id])
        res.render('PersonalArea.ejs',{
          zagol: ['ФИО','Номер группы','email','Роли'],
          rows: rows,
          t: 'Неверный логин или пароль'
        });
      }
        }
    prob()
      });
  app.get('/menuprep/DisciplineMenu/RedactStudents', (req,res) => {
    // console.log('get/menuprep/DisciplineMenu/RedactStudents')
    async function selectt() {
      if (req.query.disc_id==undefined ||req.query.disc_id=="")
      {
        res.send('Дисциплина отсутствует')
      }
      else {
        var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
        if (name_disc.length<1)
        {
          res.send('Дисциплина отсутствует')
        }
        else {
      column=['ФИО','Номер группы','email']
    type=['fio','numgroup','email']
    var rows=await db.any(`select fio,numgroup,email from users where users_id = any(array(select case
      when access_student is Null 
      then '{-1}'
      else
      access_student 
      end
      from discipline where disc_id=($1)))`,[req.query.disc_id])
      var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
        // console.log(name_disc)
        if (name_disc.length<1) {
          res.send('Дисциплина отсутствует')
        }
        else {
        //console.log(rows[1][Object.keys(rows[1])[-1]])
        res.render('Students.ejs',{
          zagol: column,
          json: rows,
          type: type,
          name_disc: Object.values(name_disc[0]),
          t: undefined
        })}}}}
        if (req.session.users_id==undefined){
          res.send('Для доступа войдите в систему')
        }
        else if (req.session.roles!=undefined) {
        if (!req.session.roles.includes('преподаватель')&&!req.session.roles.includes('главный администратор')){
          res.send('Недостаточно прав')
          // console.log('req.session.roles',req.session.roles)
          }
        else{
        selectt();}
        }
  });
  app.post('/menuprep/DisciplineMenu/RedactStudents', (req,res) => {
      // console.log('post/menuprep/DisciplineMenu/RedactStudents')
      // console.log(req.body)
    async function prov() {
      var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
      //-----------------ПРОВЕРКА--------------
      var emails=[];
      var rows=[];
      column=['ФИО','Номер группы','email']
      type=['fio','numgroup','email']
      var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
    for (let i = 0; i < keyss.length; i++)
    
      { 
        // console.log(req.body[keyss[i]][0])
        if (keyss[i]!='checkmain'){
        rows.push({fio: req.body[keyss[i]][0],numgroup:req.body[keyss[i]][1],email:req.body[keyss[i]][2]})
        // console.log('rows',rows)
        emails.push(req.body[keyss[i]][2])
  }
      }
      // console.log(emails)
      let t=await db.any("select email from users where email=ANY(($1)) and not (roles<@ ARRAY['студент'])",[emails])
      if (t.length>0)
        {
          // console.log('t',Object.values(t[0]))
          res.render('Students.ejs',{
            zagol: column,
            json: rows,
            type: type,
            name_disc: Object.values(name_disc[0]),
            t:  'Данная почта зарезервирована:'+Object.values(t[0])
          })
        }
  else{
      //-----------------СОХРАНЕНИЕ--------------
      let users_id=[];
      var disc_id=req.query.disc_id;
      var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
  for (let i = 0; i < keyss.length; i++)
      {  if (keyss[i]!='checkmain'){
          for (let j = 0; j < req.body[keyss[i]].length; j++) {
            req.body[keyss[i]][j]=req.body[keyss[i]][j].replace(/\s+/g, ' ').trim()
          }
        // console.log('req.body[keyss[i]]',req.body[keyss[i]])
        //WHERE fio=($2) OR login=($3) OR email=($4);
        var q2 =await db.any("UPDATE users SET (fio,numgroup,email) = ($1:csv) WHERE fio=($2) OR email=($3) RETURNING users_id;",
        [req.body[keyss[i]],req.body[keyss[i]][0],req.body[keyss[i]][2]])
        // console.log(q2)
        if (q2.length<1)
        { 
          // console.log('rtjkrjtkrj')
          var q2=await db.any("insert into users (fio,numgroup,email) values ($1:csv) RETURNING users_id",
        [req.body[keyss[i]]])
        // console.log('users_id update',q2,q2[0].users_id)
        }
        users_id.push(Number(q2[0].users_id));
           }}
           await db.any(`UPDATE discipline SET access_student = ($1) WHERE disc_id=($2)`, [users_id,disc_id])
        //?????
          //  var delusers=await db.any("delete from users where roles<@ ARRAY['студент'] and (not fio =ANY(($1)) or not email=ANY(($2))) returning users_id",[fios,emails])
          //  delusers=delusers.map((num) => Number(num.users_id))
          //  console.log(dell)
           await db.any("delete from table_answer where  not (users_id =ANY(($1))) and disc_id=($2) RETURNING users_id;",[users_id,disc_id])
           await db.any("delete from table_score where not (users_id =ANY(($1))) and disc_id=($2) RETURNING users_id;",[users_id,disc_id])
           column=['ФИО','Номер группы','email']
    type=['fio','numgroup','email']
    var rows=await db.any(`select fio,numgroup,email from users where roles <@ ARRAY['студент'] and users_id=
    any(array(select case
      when access_student is Null 
      then '{-1}'
      else
      access_student 
      end from discipline where disc_id=($1)))`,[req.query.disc_id])
        // console.log('rowsprov',rows)
        //console.log(rows[1][Object.keys(rows[1])[-1]])
          //-----------------ОТПРАВКА ЕМЭЙЛОВ--------------
          var rows=await db.any(`select fio,numgroup,email from users where roles <@ ARRAY['студент'] and users_id=
    any(array(select case
      when access_student is Null 
      then '{-1}'
      else
      access_student 
      end from discipline where disc_id=($1)))`,[req.query.disc_id])
          // console.log('rowsprov',rows)
          var checkmain=req.body['checkmain'];
          // console.log('checkmain',checkmain)
          var tet=undefined;
          if (checkmain!=undefined)
             {
          for (let i of checkmain){
          //  console.log(' req.body[i][2]',req.body[i][2])
           let t=await db.any("select login,passwords from users where email=($1)",[req.body[i][2]])
          //  console.log('t',Object.values(t[0]))
          //  console.log(Object.values(t[0])[0])
           try{
             var success=sendMail(req.body[i][2],Object.values(t[0])[0],Object.values(t[0])[1]);
            //  console.log(req.body[i][2],Object.values(t[0])[0],Object.values(t[0])[1],'Cупергуд')
              if (!success)
              {
                // console.log('Ошибка отправки')
              // console.log('t',Object.values(t[0]),req.body[i][5],Object.values(t[0])[1])
              res.render('Students.ejs',{
                name_disc: Object.values(name_disc[0]),
                zagol: column,
                json: rows,
                type: type,
                t: 'Ошибка отправки логина и пароля на почту:'+Object.values(t[0])[1]
              })
              }
             }
             catch {
            //   console.log('Ошибка отправки')
            //  console.log('t',Object.values(t[0]))
             res.render('Students.ejs',{
              name_disc: Object.values(name_disc[0]),
               zagol: column,
               json: rows,
               type: type,
               t: 'Ошибка отправки логина и пароля на почту:'+req.body[i][2]
             })
            }
          }
        tet='Емэйлы успешно отправлены'
      }  
      res.render('Students.ejs',{
        name_disc: Object.values(name_disc[0]),
        zagol: column,
        json: rows,
        type: type,
        t: tet
      })
  }
  }
      prov()
  });
  app.get('/menuprep/DisciplineMenu', (req,res) => {
    // console.log('get/menuprep/DisciplineMenu')
    // req.session.users_id=2;
    // req.session.roles='преподаватель'
    async function selectt() {
      // console.log(req.session.users_id)
      if (req.query.disc_id==undefined ||req.query.disc_id=="")
      {
        res.send('Дисциплина отсутствует')
      }
      else {
        var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
        if (name_disc.length<1)
        {
          res.send('Дисциплина отсутствует')
        }
        else {
      var access_teacher=await db.any("select access_teacher from discipline where disc_id=($1)",[req.query.disc_id])
      // console.log(access_teacher[0].access_teacher);
      if (access_teacher[0].access_teacher!=null) {
            //console.log(Object.values(access_for[0].access_for).includes(req.session.users_id),Object.values(access_for[0].access_for).includes(String(req.session.users_id)),access_for[0],access_for[0].access_for)

      if (Object.values(access_teacher[0].access_teacher).includes(String(req.session.users_id))){
        var t=true;
      }
      else {var t=false;}}
      var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
      var rows=await db.any(`select distinct numgroup from users where users_id=ANY(ARRAY(select case
        when access_student is Null 
        then '{-1}'
        else
        access_student 
        end
        from discipline where disc_id=($1))) and numgroup is not null and numgroup!='' order by 1`,[req.query.disc_id])
        //console.log(rows)
        //console.log(rows[1][Object.keys(rows[1])[-1]])
        res.render('DisciplineMenu.ejs',{
          disc_id: req.query.disc_id,
          name_disc: Object.values(name_disc[0]),
          json: rows,
          t: t
        })}}}
        if (req.session.users_id==undefined){
          res.send('Для доступа войдите в систему')
        }
        else if (req.session.roles!=undefined) {
        if (!req.session.roles.includes('преподаватель')&&!req.session.roles.includes('главный администратор')){
          res.send('Недостаточно прав')
          // console.log('req.session.roles',req.session.roles)
          }
        else{
        selectt();}}
  });
  app.get('/menuprep/DisciplineMenu/passage', (req,res) => {
    //Результаты прохождения теста
    //table_answer (for teacher)
    // console.log('get/menuprep/DisciplineMenu/passage')
    // console.log(req.body)
    // console.log(req.query)
    async function selectt() {
      if (req.query.disc_id==""||req.query.numgroup==""|| req.query.disc_id==undefined || req.query.numgroup==undefined ||(req.query.test!='demo'&& req.query.test!='ekz'))
      {
        // console.log(req.query.test,req.query.disc_id,req.query.numgroup)
        res.send('Данные недоступны')
      }
      else {
        var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
        var numgroup=await db.any("select distinct numgroup from users where numgroup=($1)",[req.query.numgroup])
        if (name_disc.length<1)
        {
          res.send('Дисциплина отсутствует')
        }
        else if (numgroup.length<1)
        {
          res.send('Номер группы не существует')
        }
        else {
    column=['ФИО','Текст вопроса','Правильный ответ','Ответ','Максимальный\nбалл','Балл']
    type=['int','text','text','text','text','max_text','number_change']
    var rows=await db.any("select table_ans_id, fio,text_q, right_q,answer,table_"+req.query.test+".point as max_point, table_answer.point from table_answer JOIN table_"+req.query.test+" USING (table_id) join users using (users_id) where test=($1) and table_answer.disc_id=($2) and numgroup=($3)",[req.query.test,req.query.disc_id,req.query.numgroup])
      //  console.log(rows) 
    //from table_answer JOIN table_ekz USING (table_id) join users using (users_id)
    //console.log(rows)
        //console.log(rows[1][Object.keys(rows[1])[-1]])
        res.render('finalscore.ejs',{
          zagol: column,
          json: rows,
          type: type,
          t: undefined,
        })}
      }
    }
        if (req.session.users_id==undefined){
          res.send('Для доступа войдите в систему')
        }
        else if (req.session.roles!=undefined) {
        if (!req.session.roles.includes('преподаватель')&&!req.session.roles.includes('главный администратор')){
          res.send('Недостаточно прав')
          // console.log('req.session.roles',req.session.roles)
          }
        else{
        selectt();
      }}
  });
  app.get('/menuprep/DisciplineMenu/RedactTest', (req,res) => {
    //Результаты прохождения теста
    //table_answer (for teacher)
    // console.log('get/menuprep/DisciplineMenu/RedactTest')
    // console.log(req.body)
    // console.log(req.query)
    async function selectt() {
      if (req.query.disc_id==""|| req.query.disc_id==undefined ||(req.query.test!='demo'&& req.query.test!='ekz'))
      {
        // console.log(req.query.test,req.query.disc_id,req.query.numgroup, 'жопа')
        res.send('Данные недоступны')
      }
      else {
        var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
        if (name_disc.length<1)
        {
          res.send('Дисциплина отсутствует')
        }
        else {
          var test=req.query.test;
          var disc_id=req.query.disc_id
          // console.log(disc_id)
          if (test=='demo')
          {
            table='table_demo';
          }
          else {
            table='table_ekz';
          }
          var row=await db.any('SELECT name_disc from discipline where disc_id=($1);',[req.query.disc_id])
            try{
              var name_d=row[0].name_disc;
              } catch{
                res.send('Дисциплина отсутствует')
              }
          // console.log('tjtkjt',name_d);
            var rows=await db.any('SELECT * from '+table+' where disc_id=($1) order by table_id;',[disc_id])
              // console.log('rows',rows)
                res.render('RedactTest', {
                  json: rows,
                  name_d: name_d
            })
          }
      }
    }
        if (req.session.users_id==undefined){
          res.send('Для доступа войдите в систему')
        }
        else if (req.session.roles!=undefined) {
        if (!req.session.roles.includes('преподаватель')&&!req.session.roles.includes('главный администратор')){
          res.send('Недостаточно прав')
          // console.log('req.session.roles',req.session.roles)
          }
        else{
        selectt();}
      }
  });
  app.post('/menuprep/DisciplineMenu/RedactTest', function(req, res) {
    // console.log('post/menuprep/DisciplineMenu/RedactTest')
  
    async function save() {
      var test=req.query.test;
      var disc_id=req.query.disc_id
    // console.log(req.body)
    if (test=='demo')
    {
      table='table_demo';
    }
    else {
      table='table_ekz';
    }
    /// {1,}[ ^\r]|\t/g
    // console.log('table',table)
    var keyss=Object.keys(req.body);
    for (let i = 0; i < keyss.length; i++)
        { 
          // console.log('req.body[fhfhfh]',req.body[keyss[i]])
        if (keyss[i].includes('text')||keyss[i].includes('name'))
          {
            req.body[keyss[i]]=req.body[keyss[i]].replace(/ {1,}[ ^\r]|\t/g,' ').trim()
          }
        else {
          if (Array.isArray(req.body[keyss[i]])){
            for (let j = 0; j < req.body[keyss[i]].length; j++) {
              req.body[keyss[i]][j]=req.body[keyss[i]][j].replace(/\s+/g, ' ').trim()
            }
          }
          else{
          req.body[keyss[i]]=req.body[keyss[i]].replace(/\s+/g, ' ').trim()
        }}
        }
    // console.log(req.body);
    await db.any("delete from "+table+" where disc_id=($1)",[disc_id])
    var reqdata=req.body;
    reqkeys=Object.keys(req.body).length
    if (Object.keys(reqdata).length!=0){  
    var keyss=Object.keys(reqdata);
    var m=keyss.filter(word => word.includes ("text_q"))
    var l=[]
    for (let i = 0; i < m.length; i++)
      {
          l[i]=Number(m[i].replace("text_q",""))
          // console.log(l[i])
      }
    for (let i = 0; i < l.length; i++){ 
          if (reqdata['type_q'+l[i]]=="text"){
          reqdata['variants'+l[i]]=[0];
        }
    // console.log('reqdata',reqdata)
      if (Array.isArray(reqdata['right_q'+l[i]])){
          await db.query("insert into "+table+" (disc_id, name_q,text_q,point,type_q,variants,right_q) values ($1,$2,$3,$4,$5,$6,$7);",
           [disc_id, reqdata['name_q'+l[i]],reqdata['text_q'+l[i]],reqdata['point'+l[i]],reqdata['type_q'+l[i]],reqdata['variants'+l[i]],reqdata['right_q'+l[i]]]);
        }
        else {
          reqdata['right_q'+l[i]]='{'+reqdata['right_q'+l[i]]+'}'
          await db.query("insert into "+table+" (disc_id, name_q,text_q,point,type_q,variants,right_q) values ($1,$2,$3,$4,$5,$6,$7);",
           [disc_id, reqdata['name_q'+l[i]],reqdata['text_q'+l[i]],reqdata['point'+l[i]],reqdata['type_q'+l[i]],reqdata['variants'+l[i]],reqdata['right_q'+l[i]]]);
        }
      }
    }
    var row= await db.any('SELECT name_disc from discipline where disc_id=($1);',disc_id) 
      var name_d=row[0].name_disc;
    // console.log('tjtkjt',name_d);
    var rows=await db.any('SELECT * from '+table+' where disc_id=($1) order by table_id;',disc_id)
          res.render('RedactTest', {
            json: rows,
            name_d: name_d
          })
    }
    try{
    save();
  }
    catch{
      res.send(404)
    }
  });
  app.post('/menuprep/DisciplineMenu/passage', (req,res) => {
    //Результаты прохождения теста
    //table_answer (for teacher)
    // console.log('post/menuprep/DisciplineMenu/passage')
    // console.log(req.body,req.query.test,req.query.disc_id)
    async function prov() {
      var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
    for (let i = 0; i < keyss.length; i++)
      { console.log([req.body[keyss[i]],keyss[i]])
        var r=await db.any("UPDATE table_answer SET point = ($1) where table_ans_id=($2) returning table_ans_id",[req.body[keyss[i]],Number(keyss[i])])
        db.query(`UPDATE table_score SET (final_score, max_score, per_score)=(
        SELECT sum(table_answer.point) as final_score, sum(table_`+req.query.test+`.point) as max_score, 
        round(round(sum(table_answer.point),10)/round(sum(table_`+req.query.test+`.point),10),2)*100 as per_score
        from public.table_answer,public.table_`+req.query.test+`
        where test=($2) and table_answer.table_id=table_`+req.query.test+`.table_id
        and table_answer.disc_id=table_`+req.query.test+`.disc_id and table_score.users_id=table_answer.users_id
        group by users_id)
        where test=('ekz');`,[req.query.disc_id,req.query.test]);
        // console.log(r)
      }
      // console.log('wekjtejtkejt')
      var rows=await db.any("select table_ans_id, fio,text_q, right_q,answer,table_"+req.query.test+".point as max_point, table_answer.point from table_answer JOIN table_"+req.query.test+" USING (table_id) join users using (users_id) where test=($1) and table_answer.disc_id=($2) and numgroup=($3)",[req.query.test,req.query.disc_id,req.query.numgroup])
      column=['ФИО','Текст вопроса','Правильный ответ','Ответ','Максимальный\nбалл','Балл']
      type=['int','text','text','text','text','max_text','number_change']
      //console.log(rows)
      //console.log(rows[1][Object.keys(rows[1])[-1]])
      res.render('finalscore.ejs',{
        zagol: column,
        json: rows,
        type: type,
        t: undefined
      })
    }

      prov()
  });
  app.get('/menuprep/DisciplineMenu/finalscore', (req,res) => {
    //Результаты прохождения теста
    //table_answer (for teacher)
    // console.log('get/menuprep/DisciplineMenu/finalscore')
    // console.log(req.body)
    async function selectt() {
      if (req.query.disc_id==""||req.query.numgroup=="" || req.query.disc_id==undefined || req.query.numgroup==undefined ||(req.query.test!='demo'&& req.query.test!='ekz'))
      {
        // console.log(req.query.test,req.query.disc_id,req.query.numgroup)
        res.send('Данные недоступны')
      }
      else {
        var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
        var numgroup=await db.any("select distinct numgroup from users where numgroup=($1)",[req.query.numgroup])
        if (name_disc.length<1)
        {
          res.send('Дисциплина отсутствует')
        }
        else if (numgroup.length<1)
        {
          res.send('Номер группы не существует')
        }
        else {
      column=['ФИО','Сумма \n баллов','Максимум \n баллов','%','Оценка','Разделение \n для оценки','Попытка']
    type=['int','text','text','text','text','text','number_array_change','Poputka']
    var rows=await db.any("select table_score.users_id,fio,final_score, max_score,per_score,grade,separation,attempt from table_score join users using (users_id) where table_score.test=($1) and table_score.disc_id=($2) and users.numgroup=($3)",[req.query.test,req.query.disc_id,req.query.numgroup])
        // console.log(rows)
        //console.log(rows[1][Object.keys(rows[1])[-1]])
        res.render('finalscore.ejs',{
          zagol: column,
          json: rows,
          type: type,
          t: undefined
        })}}}
        if (req.session.users_id==undefined){
          res.send('Для доступа войдите в систему')
        }
        else if (req.session.roles!=undefined) {
          if (!req.session.roles.includes('преподаватель')&&!req.session.roles.includes('главный администратор')){
          res.send('Недостаточно прав')
          // console.log('req.session.roles',req.session.roles)
          }
        else{
        selectt();}
      }
  });
  app.post('/menuprep/DisciplineMenu/finalscore', (req,res) => {
    //Результаты прохождения теста
    //table_answer (for teacher)
    // console.log('post/menuprep/DisciplineMenu/finalscore')
    // console.log(req.body)
    async function selectt() {
      column=['ФИО','Cумма \n баллов','Максимум \n баллов','%','Оценка','Разделение \n для оценки','Попытка']
    type=['int','text','text','text','text','text','number_array_change','Poputka']
    // console.log(Object.values(req.body))
    var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
for (let i = 0; i < keyss.length; i++)
    { 
        for (let j = 0; j < req.body[keyss[i]].length; j++) {
          req.body[keyss[i]][j]=req.body[keyss[i]][j].replace(/\s+/g, ' ').trim()
          console.log(Object.values(req.body)[i])
          if (req.body[keyss[i]][j]==''){
            req.body[keyss[i]][j]=null
            console.log(Object.values(req.body)[i])
          }
        }
        if (req.body[keyss[i]][0]!=null){
          // console.log(Object.values(req.body)[i])
          req.body[keyss[i]][0]='{'+req.body[keyss[i]][0]+'}'
        }
        // console.log(Object.values(req.body)[i],keyss[i],req.query.test,req.query.disc_id)
        var r=await db.any("UPDATE table_score set (separation,attempt)=($1:csv) where text(users_id)=($2) and test=($3) and disc_id=($4) returning score_id",[Object.values(req.body)[i],keyss[i],req.query.test,req.query.disc_id])
        // console.log('r',r)
  }
  var rows=await db.any("select  table_score.users_id,fio,final_score, max_score,per_score,grade,separation,attempt from table_score join users using (users_id) where table_score.test=($1) and table_score.disc_id=($2) and users.numgroup=($3)",[req.query.test,req.query.disc_id,req.query.numgroup])
      //console.log(rows)
      //console.log(rows[1][Object.keys(rows[1])[-1]])
      res.render('finalscore.ejs',{
        zagol: column,
        json: rows,
        type: type,
        t: undefined
      })}
        if (req.session.users_id==undefined){
          res.send('Для доступа войдите в систему')
        }
        else 
        if (req.session.roles!=undefined) {
          if (!req.session.roles.includes('преподаватель')&&!req.session.roles.includes('главный администратор')){
          res.send('Недостаточно прав')
          // console.log('req.session.roles',req.session.roles)
          }
        else{
        selectt();}
      }
  });
  app.get('/menuprep/DisciplineMenu/systempoint', (req,res) => {
    //Результаты прохождения теста
    //table_answer (for teacher)
    // console.log('get/menuprep/DisciplineMenu/systempoint')
    // console.log(req.body)
    async function selectt() {
      if (req.query.disc_id==""||req.query.numgroup=="" || req.query.disc_id==undefined || (req.query.test!='demo'&& req.query.test!='ekz'))
      {
        res.send('Данные недоступны')
      }
      else {
        var name_disc=await db.any("select name_disc from discipline where disc_id=($1)",[req.query.disc_id])
        if (name_disc.length<1)
        {
          res.send('Дисциплина отсутствует')
        }
        else {
      column=['Название','Текст задания','Тип вопроса','Варианты ответов','Правильные ответы','Балл']
    type=['int','text','text','text','text','text','number_change']
    var rows=await db.any(`select table_id,name_q,text_q, case
    when type_q='checkbox'
    then 'Выбор нескольких ответов' 
    else case when type_q='text'
      then 'Текстовая форма ответа' 
      else case when type_q='radio'
        then 'Выбор одного ответа'
        end
      end
    end as type_q, case
    when variants=ARRAY['0']
    then Null
    else variants
    end as variants, right_q, point 
    from table_`+req.query.test+` where disc_id=($1)`,[req.query.disc_id])
        // console.log(rows)
        //console.log(rows[1][Object.keys(rows[1])[-1]])
        res.render('finalscore.ejs',{
          zagol: column,
          json: rows,
          type: type,
          t: undefined
        })}}}
        if (req.session.users_id==undefined){
          res.send('Для доступа войдите в систему')
        }
        else if (req.session.roles!=undefined) {
        if (!req.session.roles.includes('преподаватель')&&!req.session.roles.includes('главный администратор')){
          res.send('Недостаточно прав')
          // console.log('req.session.roles',req.session.roles)
          }
        else{
        selectt();
      }}
  });
  app.post('/menuprep/DisciplineMenu/systempoint', (req,res) => {
    //Результаты прохождения теста
    //table_answer (for teacher)
    // console.log('post/menuprep/DisciplineMenu/systempoint')
    // console.log(req.body)
    async function selectt() {
      column=['Название','Текст задания','Тип вопроса','Варианты ответов','Правильные ответы','Балл']
      type=['int','text','text','text','text','text','number_change']
    var keyss=Object.keys(req.body); // выведет 0, затем 1, затем 2
for (let i = 0; i < keyss.length; i++)
    { 
      // console.log(Object.values(req.body)[i],req.query.disc_id,keyss[i])
        var r=await db.any(`UPDATE table_`+req.query.test+` set point=($1)
        WHERE disc_id=($2) and table_id=($3)`,[Object.values(req.body)[i],req.query.disc_id,keyss[i]])
        // console.log('r',r)
  }
  var rows=await db.any(`select table_id,name_q,text_q, case
  when type_q='checkbox'
  then 'Выбор нескольких ответов' 
  else case when type_q='text'
    then 'Текстовая форма ответа' 
    else case when type_q='radio'
      then 'Выбор одного ответа'
      end
    end
  end as type_q, case
  when variants=ARRAY['0']
  then Null
  else variants
  end as variants, right_q, point 
  from table_`+req.query.test+` where disc_id=($1)`,[req.query.disc_id])
      //console.log(rows[1][Object.keys(rows[1])[-1]])
      res.render('finalscore.ejs',{
        zagol: column,
        json: rows,
        type: type,
        t: undefined
      })}
        if (req.session.users_id==undefined){
          res.send('Для доступа войдите в систему')
        }
        else if (req.session.roles!=undefined) {
        if (!req.session.roles.includes('преподаватель')&&!req.session.roles.includes('главный администратор')){
          res.send('Недостаточно прав')
          // console.log('req.session.roles',req.session.roles)
          }
        else{
        selectt();
      }}
  });
app.listen(port,()=>
    console.log(`server running at http://localhost:${port}`)//подключаемся к серверу
);
console.log('Сервер стартовал!');
//npm install nodemon pg-promise express
//npm start
