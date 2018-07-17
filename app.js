

let express = require('express') ;
let path = require('path') ;
let app = express() ;
let session = require('express-session');
let bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient;
// connection url 连接的地址
const url = 'mongodb://localhost:27017';
 
// Database Name 数据库的名字
const dbName = 'myproject';

// 托管静态资源
app.use(express.static('static')) ;
// 使用session中间件
// 以后的每个路由中多了一个可以访问到的session的值 我们可以吧想要共享的值保存到session中
app.use(session({
    secret: 'keyboard cat'
  }))

let svgCaptcha = require('svg-captcha');
// 使用body-parser格式化表单数据 
app.use(bodyParser.urlencoded({ extended: false }))
// 路由1
app.get('/login', function (req, res) {
    // 直接读取文件并返回 
    // console.log(req.session);
    // console.log(req);
    res.sendFile(path.join(__dirname,'static/views/login.html'))
});
// 路由2 接收post传过来的数据 并判断验证码是否正确
app.post('/login',(req,res)=>{
    // console.log(req);//打印表单内容
    // 获取表单内容 比较表单内容 
    let username = req.body.username;
    let password = req.body.password ;
    let code = req.body.code ;
    // console.log(code);

    if(code==req.session.captcha){
        // console.log('success');
        req.session.userInfo={
            username,
            password
        }
        res.redirect('/index')
    }else{
        //  console.log('失败')
        // 页面跳转 
        // 设置编码格式 
        // 这里不用设置编码格式 send会自动设置
         res.send('<script>alert("验证码错误");window.location.href="/login"</script>')
    }

    // res.send('login')
})
// 路由3 生成验证码
app.get('/login/login.png', function (req, res) {
	let captcha = svgCaptcha.create();
    // console.log(captcha.text);
    req.session.captcha=captcha.text.toLocaleLowerCase() ;
    // 将验证码的值存到session中 以便于以后的访问
    // console.log(req.session.captcha);
	res.type('svg'); // 使用ejs等模板时如果报错 res.type('html')
	res.status(200).send(captcha.data);
});

// 路由4 index页面的访问
app.get('/index',(req,res)=>{
    if(req.session.userInfo){
        res.sendFile(path.join(__dirname,'static/views/index.html'))
    }else{
        res.setHeader ('content-type','text/html') ;
        res.send("<script>alert('请先登录');window.location.href='/login'</script>")
    }
})
// 路由五 登出操作
app.get('/loginout',(req,res)=>{
    // 删除session
    delete req.session.userInfo ;
    // 跳转到登录页 
    res.redirect('/login')
})
// 路由6 跳到注册页
app.get('/register',(req,res)=>{
    res.sendFile(path.join(__dirname,'static/views/register.html'))
})
// 路由7 进行用户名 密码的注册
app.post('/register',(req,res)=>{
    let userName = req.body.username ;
    let userPass = req.body.password ;
    MongoClient.connect(url,  (err, client)=>{
        // 连上mongo之后 选择使用的库
        const db = client.db(dbName);
        // 选择使用的集合
        let collection = db.collection('userList');

        // 查询数据
        collection.find({
            userName
        }).toArray((err,doc)=>{
            console.log(doc);
            if(doc.length==0){
                // 没有人
                // 新增数据
                collection.insertOne({
                    userName,
                    userPass
                },(err,result)=>{
                    console.log(err);
                    // 注册成功了
                    res.setHeader('content-type','text/html');
                    res.send("<script>alert('欢迎入坑');window.location='/login'</script>")
                    // 关闭数据库连接即可
                    client.close();
                })
            }
        })
        
    });
})
app.listen(88,'127.0.0.1',()=>{
    console.log('success');
})