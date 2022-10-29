const nodemailer = require('nodemailer')

async function sendMail (email,login,password) { 
  try{
  // let testEmailAccount = await nodemailer.createTestAccount()
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
   //secure: true,
  auth: {
    user: 'diplomolga2000@gmail.com',
    pass: 'qobsqlkmtzykmbgr',
  },
})
await transporter.sendMail({
  from: '"Node js" <nodejs@example.com>',
  to: email,
  subject: 'Данные для входа в систему',
  html:'Данные для входа в систему<br> <strong> Логин:</strong>'+login+'<br> <strong> Пароль:</strong>'+password,
})
return true}
catch {
  return false}
}
module.exports=sendMail;
