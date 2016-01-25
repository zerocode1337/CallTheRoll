var express = require('express');
var router = express.Router();
//验证码相关模块
var ccap = require('ccap');
//md5相关模块
var crypto = require('crypto');
var fs = require('fs');
var Teacher = require('../models/teachers.js');
var Course = require('../models/course.js');
var Student = require('../models/student.js');
var Comment = require('../models/comment.js');
var passport = require('passport');
var formidable = require("formidable");

module.exports = function(app){
    app.get('/', function(req,res,next){
        res.render('index',{
            title: 'SDIBT－点名系统',
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.get('/regt', checkNotLogin);
    app.get('/regt', function(req,res,next){
        res.render('regTeacher', {
            user: req.session.teacher,
            title: '教师注册',
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/regt', checkNotLogin);
    app.post('/regt', function(req,res,next){
        var name = req.body.name
            ,email = req.body.email
            ,code = req.body.code
            ,verify = req.body.verify.toUpperCase();
        if(verify != req.session.txt){
            req.flash('error',"验证码不正确!");
            return res.redirect('back');
        }
        if(code != 'csbt34.ydhl12s'){
            req.flash('error','邀请码不对哦！');
            return res.redirect('back');
        }
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        var newTeacher = new Teacher({
            name: name,
            email: email,
            realName : null,
            password: password
        });
        Teacher.get(newTeacher.name, function(err,user){
            if (err) {
                req.flash('error',err);
                return res.redirect('/');
            }
            if(user){
                req.flash('error','the user repeat!');
                return res.redirect('back');
            }
            newTeacher.save(function(err,user){
                if(err){
                    req.flash('error',err);
                    return res.redirect('back');
                }
                req.session.teacher = user.ops[0];
                req.flash('success',"register success!");
                console.log(req.session.teacher);
                res.redirect('/teacher');
            });
        });
    });
    app.get('/regs', checkNotLoginStudent);
    app.get('/regs', function(req,res,next){
        res.render('regStudent', {
            user: req.session.student,
            title: '学生注册',
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/regs', function(req,res,next){
        var name = req.body.name
            ,email = req.body.email
            ,verify = req.body.verify.toUpperCase();
        if(verify != req.session.txt){
            req.flash('error','验证码不正确！');
            return res.redirect('back');
        }
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        var newStudent = new Student({
            name: name,
            email: email,
            realName: null,
            password: password,
            no_id: null,
            major: null,
            dept: null
        });
        Student.get(newStudent.name, function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            if(user){
                req.flash('error','The user repeat!');
                return res.redirect('back');
            }
            newStudent.save(function(err,user){
                if (err) {
                    req.flash('error',err);
                    return res.redirect('back');
                }
                req.session.student = user.ops[0];
                req.flash('success', 'register success!');
                res.redirect('/student');
            });
        });
    });
    app.get('/logint', function(req,res,next){
        if(req.session.teacher){
            req.flash('error','已登录');
            res.redirect('/teacher');
        }
        next();
    });
    app.get('/logint', function(req,res,next){
        res.render('loginTeacher',{
            title: '教师登陆',
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/logint', checkNotLogin);
    app.post('/logint', function(req,res,next){
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        Teacher.get(req.body.name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.direct('/');
            }
            if((!user) || (user.password != password)){
                req.flash('error','用户名或密码错误！');
                return res.redirect('/logint');
            }
            req.session.teacher = user;
            console.log(req.session.teacher);
            req.flash('success','登录成功!');
            res.redirect('/teacher');
        });
    });
    app.get('/logins', checkNotLoginStudent);
    app.get('/logins', function(req,res,next){
        res.render('loginStudent',{
            title: '学生登陆',
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/logins', function(req,res,next){
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        Student.get(req.body.name, function(err,user){
            if (err) {
                req.flash('error',err);
                return res.direct('/');
            }
            if((!user) || (user.password != password)){
                req.flash('error','用户名或密码错误！');
                return res.redirect('/logins');
            }
            req.session.student = user;
            req.flash('success','登陆成功！');
            res.redirect('/student');
        });
    });
    app.get('/logoutt', checkLogin);
    app.get('/logoutt' ,function(req,res,next){
        req.session.teacher = null;
        req.flash('success','登出成功!');
        res.redirect('/');
    });
    app.get('/logouts', checkLoginStudent);
    app.get('/logouts', function(req,res,next){
        req.session.student = null;
        req.flash('success','登出成功！');
        res.redirect('/');
    });
    app.get('/teacher', function(req,res,next){
        res.render('teacher', {
            title: '教师中心',
            teacher: req.session.teacher,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.get('/student', function(req,res,next){
        res.render('student',{
            title: '学生中心',
            student: req.session.student,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.get('/teacher/settings', checkLogin);
    app.get('/teacher/settings', function(req,res,next){
        res.render('settings',{
            title: '个人设置',
            teacher: req.session.teacher,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.get('/student/settings', checkLoginStudent);
    app.get('/student/settings', function(req,res,next){
        res.render('studentSettings',{
            title: '个人设置',
            student: req.session.student,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/teacher/settings', function(req,res,next){
        var settingEmail = (req.body.settingEmail)||(req.session.teacher.email) ;
        var settingRealname = req.body.settingRealname;
        if(req.body.nowPass){
            var nowPasshash = crypto.createHash('md5').update(req.body.nowPass).digest('hex');
        }else{
            var nowPasshash = req.session.teacher.password;
        }
        if (req.body.newPass){
            var newPasshash = crypto.createHash('md5').update(req.body.newPass).digest('hex');
        }else{
            var newPasshash = req.session.teacher.password;
        }
        if (nowPasshash != req.session.teacher.password) {
            req.flash('error',"当前密码不正确！");
            return res.redirect('back');
        }
        var newTeacher = new Object();
        newTeacher.name = req.session.teacher.name;
        newTeacher.realName = settingRealname;
        newTeacher.password = newPasshash;
        newTeacher.email = settingEmail;
        Teacher.update(newTeacher, function(err){
            if (err) {
                req.flash('error',err);
                return res.redirect('back');
            }
            req.session.teacher = newTeacher;
            req.flash('success','修改成功！');
            return res.redirect('/teacher');
        });
    });
    app.post('/student/settings', function(req,res,next){
        var settingEmail = (req.body.settingEmail)||(req.session.student.email) ;
        var settingRealname = req.body.settingRealname;
        var settingDept = req.body.settingDept;
        var settingMajor = req.body.settingMajor;
        var settingNo = req.body.settingnoId;
        var settingPhoto = req.body.settingTempPhoto;
        if(req.body.nowPass){
            var nowPasshash = crypto.createHash('md5').update(req.body.nowPass).digest('hex');
        }else{
            var nowPasshash = req.session.student.password;
        }
        if (req.body.newPass){
            var newPasshash = crypto.createHash('md5').update(req.body.newPass).digest('hex');
        }else{
            var newPasshash = req.session.student.password;
        }
        if (nowPasshash != req.session.student.password) {
            req.flash('error',"当前密码不正确！");
            return res.redirect('back');
        }
        var newStudent = new Object();
        newStudent.name = req.session.student.name;
        newStudent.realName = settingRealname;
        newStudent.password = newPasshash;
        newStudent.email = settingEmail;
        newStudent.no_id = settingNo;
        newStudent.major = settingMajor;
        newStudent.dept = settingDept;
        newStudent.photo = settingPhoto;
        Student.update(newStudent, function(err){
            if (err) {
                req.flash('error',err);
                return res.redirect('back');
            }
            req.session.student = newStudent;
            req.flash('success','修改成功！');
            res.redirect('back');
        });
    });
    app.get('/student/selectCourse', checkLoginStudent);
    app.get('/student/selectCourse', function(req,res,next){
        Course.getAll(null, function(err,docs){
            if (err) {
                docs = [];
                req.flash('error',err);
                return res.redirect('/');
            }
            req.session.course = docs;
            res.render('courseList',{
                title:'选择课程',
                classes: docs,
                student: req.session.student,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/student/addCourse/:index/:pass', checkLoginStudent);
    app.get('/student/addCourse/:index/:pass', function(req,res,next){
        var indexNum = req.params.index;
        var password = req.params.pass;
        var course = req.session.course;
        var tempCourse = course[indexNum];
        var student = new Object();
        student.name = req.session.student.realName;
        student.no_id = req.session.student.no_id;
        student.photo = req.session.student.photo;
        if(password == tempCourse.course_password){
            Course.getStuCourse(student.no_id,function(err,doc){
                if(err){
                    doc = [];
                    req.flash('error',err);
                    return res.redirect('back');
                }
                var flag = 0;
                for(var i = 0; i < doc.length; i++){
                    if(doc[i]._id == tempCourse._id){
                        flag = 1;
                        break;
                    }
                }
                if(flag == 1){
                    req.flash('error','亲，别作死哦，你选过我了！');
                    return res.redirect('back');
                }else{
                    Course.update(tempCourse.course_name,tempCourse.course_major,student,function(err){
                        if (err) {
                            req.flash('error',err);
                            return res.redirect('back');
                        }
                        req.flash('success','选课成功！');
                        return res.redirect('/student/courseList');
                    });
                }
            });
        }else{
            req.flash('error','暗号都不知道，你是猴子请来的逗比吗！');
            return res.redirect('back');
        }
    });
    app.get('/student/courseList', checkLoginStudent);
    app.get('/student/courseList', function(req,res,next){
        Course.getStuCourse(req.session.student.no_id, function(err,docs){
            if(err){
                docs = [];
                req.flash('error',err);
                res.redirect('back');
            }
            res.render('selectedCourseList',{
                title:'已选课程',
                classes: docs,
                student: req.session.student,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/teacher/addclass', checkLogin);
    app.get('/teacher/addclass', function(req,res,next){
        res.render('addclass',{
            title: '添加班级',
            teacher: req.session.teacher,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/teacher/addclass', function(req,res,next){
        var major = req.body.major;
        var faculty = req.body.faculty;
        var courseName = req.body.courseName;
        var coursePeriod = req.body.courseTime;
        var coursePassword = req.body.coursePassword;
        var newCourse = new Course({
            name: courseName,
            period: coursePeriod,
            teacher: req.session.teacher.realName,
            dept: faculty,
            coursePassword: coursePassword,
            major: major
        });
        newCourse.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success', '添加成功！');
            res.redirect('/teacher/classlist');
        });
    });
    app.get('/teacher/classlist', checkLogin);
    app.get('/teacher/classlist' , function(req,res,next){
        Course.getAll(req.session.teacher.realName, function(err,docs){
            if (err) {
                docs = [];
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('classlist', {
                title: '班级列表',
                classes: docs,
                teacher: req.session.teacher,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/teacher/classlist/remove/:id', checkLogin);
    app.get('/teacher/classlist/remove/:id', function(req,res,next){
        Course.remove(req.params.id, function(err){
            if (err) {
                req.flash('error',err);
                res.redirect('back');
            }
            req.flash('success','删除成功！');
            res.redirect('/teacher/classlist');
        });
    });
    app.get('/teacher/ourStudents/remove/:course_id/:id', checkLogin);
    app.get('/teacher/ourStudents/remove/:course_id/:id', function(req,res,next){
        Course.removeStudent(req.params.id,req.params.course_id,function(err){
            if (err) {
                req.flash('error',err);
                res.redirect('back');
            }
            req.flash('success','删除成功！');
            res.redirect('back');
        });
    });
    app.get('/teacher/classlist/see/:id', checkLogin);
    app.get('/teacher/classlist/see/:id', function(req,res,next){
        Course.seeStudent(req.params.id, function(err,doc){
            if (err) {
                req.flash('error',err);
                return res.redirect('back');
            }
            var stus = [];
            for (var i=0; i < doc.course_students.length; ++i) {
                stus[i] = doc.course_students[i];
            }
            stus.sort(function(s1,s2){
                if(s1.no_id < s2.no_id){
                    return -1;
                }
                if(s1.no_id > s2.no_id){
                    return 1;
                }
                return 0;
            });
            res.render('showStudents', {
                title: '学生列表',
                courseStudents: stus,
                course_id: req.params.id,
                teacher: req.session.teacher,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/teacher/callroll', checkLogin);
    app.get('/teacher/callroll', function(req,res,next){
        Course.getAll(req.session.teacher.realName, function(err,docs){
            if (err) {
                docs = [];
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('beforeCall', {
                title: '班级列表',
                classes: docs,
                teacher: req.session.teacher,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/teacher/callroll/:courseId', checkLogin);
    app.get('/teacher/callroll/:courseId', function(req,res,next){
        Course.seeStudent(req.params.courseId, function(err,doc){
            if (err) {
                req.flash('error',err);
                return res.redirect('back');
            }
            var stus = [];
            for(var i = 0; i < doc.course_students.length; i++){
                stus[i] = doc.course_students[i];
            }
            stus.sort(function(s1,s2){
                if(s1.no_id < s2.no_id){
                     return -1;
                }
                if(s1.no_id > s2.no_id){
                     return 1;
                }
                return 0;
            });
            res.render('callStudent',{
                title: '点名',
                teacher: req.session.teacher,
                courseStudents: stus,
                course: doc,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/teacher/callroll/:courseId', checkLogin);
    app.post('/teacher/callroll/:courseId', function(req,res,next){
        if(!req.body.radios1){
            req.flash('error',"当前班级没有学生！");
            return res.redirect('/teacher');
        }
        var a = req.body.radios1;
        var b = req.body.radios2;
        var c = req.body.radios3;
        console.log(a+b+c);
        var s = [];
        for(var i = 1; i <= 3; i++){
            s[i] = req.body["radios"+i];
            console.log(s[i]);
        }
    });
    app.get('/getCaptcha', function(req,res,next){
        //设置验证码样式
        var captcha = ccap({
            width:110,
            height:30,
            offset:17,
            quality:100,
            fontsize:24
        });
        var ary = captcha.get();
        //验证码文本内容
        var txt = ary[0];
        //验证码图片buf
        var buf = ary[1];
        req.session.txt = txt;
        console.log(txt);
        console.log(buf);
        console.log("type : " + typeof buf);
        res.set('Content-Type','image/jpeg');
        res.end(buf);
    });
    app.get('/tags/:tag', function(req,res){
        var page = req.query.p?parseInt(req.query.p):1;
        Post.getTag(req.params.tag,page, function(err,posts,total){
            if(err){
                posts = [];
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tag',{
                title: req.params.tag + ' | crab-home',
                posts: posts,
                photo: req.session.photo,
                user: req.session.user,
                page: page,
                isFirstPage: (page-1) == 0,
                isLastPage: ((page-1) * 10 + posts.length) == total,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/checkName/:name', function(req,res,next){
        var tempname = req.params.name;
        User.get(tempname,function(err,user){
            if(err){
                req.flash("error",err);
                res.redirect('/reg');
            }
            if(user){
                return res.end("denied");
            }else{
                return res.end("okay");
            }
        });
    });
    app.get('/checkVerify/:verify', function(req,res,next){
        var tempverify = req.params.verify.toUpperCase();
        if(tempverify == req.session.txt){
            return res.end("okay");
        }else{
            return res.end("denied");
        }
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function(req,res,next){
        var name = req.body.name;
        var password = req.body.password;
        var password_re = req.body['password-repeat'];
        var verify = req.body.verify.toUpperCase();

        console.log("verify " + verify);
        console.log("text: " + req.session.txt);
        //console.log(name + " " + password);
        if(verify != req.session.txt){
            req.flash('error',"验证码不正确!");
            return res.redirect('/reg');
        }
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        });

        User.get(newUser.name, function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            //console.log("当前user: " +　user);
            if(user){
                req.flash('error','the user repeat!');
                return res.redirect('/reg');
            }
            newUser.save(function(err,user){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                //console.log("before session" + user);
                console.log(user);
                req.session.user = user.ops[0].name;
                req.session.photo = user.ops[0].photo;
                req.session.email = user.ops[0].email;
                req.session.typeEditor = user.ops[0].crabEditor;
                req.session.password = user.ops[0].password;
                req.session.info = user.ops[0].info;
                req.session.index = user.ops[0].index;
                req.flash('success',"register success!");
                res.redirect('/');
            });
        });
    });
    app.get('/login', checkNotLogin);
    app.get('/login', function(req,res,next){
        res.render('login',{
            user: req.session.user,
            title: 'login | crab-home',
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function(req,res,next){
        //生成md5值
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        //检查用户是否存在
        User.get(req.body.name, function(err,user){
            if(err){
                req.flash('error',err);
                return res.direct('/');
            }
            if((!user) || (user.password != password)){
                req.flash('error','用户名或密码错误!');
                return res.redirect('/login');
            }
            req.session.user = user.name;
            req.session.password = user.password;
            req.session.photo = user.photo;
            req.session.email = user.email;
            req.session.typeEditor = user.crabEditor;
            req.session.info = user.info;
            req.session.index = user.index;
            req.flash('success','登录成功!');
            res.redirect('/');
        });
    });
    app.get("/login/github", passport.authenticate("github", {session: false}));
    app.get("/login/github/callback", passport.authenticate("github", {
        session: false,
        failureRedirect: '/login',
        successFlash: '登陆成功！'
    }), function (req, res) {
        User.get(req.user.username, function(err,user){
            if(err){
                req.flash('error',err);
                return res.direct('/');
            }
            if(user){
                req.flash('error','当前用户禁止登陆，可能是用户名与本站冲突！');
                res.redirect('/login');
            }else{
                req.session.user = req.user.username;
                res.redirect('/');
            }
        });
    });


    app.get('/post', checkLogin);
    app.get('/post', function(req,res,next){
        res.render('post', {
            user: req.session.user,
            photo: req.session.photo,
            typeEditor: req.session.typeEditor,
            title: '新随笔 | crab-home',
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    // app.get('/showImages/:filename' ,function(req,res,next){
    //     var filename = req.params.filename;
    //     console.log(filename);
    //     res.render('showImage', {
    //         title:'图片',
    //         user: req.session.user,
    //         photo:req.session.photo,
    //         file:filename,
    //         success: req.flash('success').toString(),
    //         error: req.flash('error').toString()
    //     });
    // });

    app.get('/showImages/:filename' ,function(req,res,next){
        var filename = req.params.filename;
        fs.readFile('/home/crab_blog/public/files/photos/'+filename+'.jpg', function(err,file){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }else{
                res.writeHead(200,{"Content-Type":"image/png"});
                res.write(file,"binary");
                res.end();
            }
        });
    });
    app.get('/test', function(req, res, next) {
        res.render('test', {
            title: '图片上传',
            photo: req.session.photo,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/post',checkLogin);
    app.post('/post', function(req,res,next){
        var currenUser = req.session.user;
        if(req.body.title == ''){
            req.flash('error','标题不能为空！');
            return res.redirect('back');
        }
        var tags = [req.body.tag1,req.body.tag2,req.body.tag3];
        var post = new Post(currenUser,req.body.title,tags,req.body.post);
        post.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            req.flash('success','发布成功!');
            res.redirect('/');
        });
    });
    app.get('/logout', checkLogin);
    app.get('/logout' ,function(req,res,next){
        req.session.user = null;
        req.session.photo = null;
        req.session.typeEditor = null;
        req.session.password = null;
        req.session.info = null;
        req.session.index = null;
        req.session.email = null;
        req.flash('success','登出成功!');
        res.redirect('/');
    });
    app.get('/upload', checkLogin);
    app.get('/upload', function(req,res,next){
        res.render('upload',{
            title: '文件上传',
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/upload', function(req,res,next){
        req.flash('success','文件上传成功!');
        res.redirect('/upload');
    });
    app.get('/personal', checkLogin);
    app.get('/personal', function(req,res,next){
        res.render('personal', {
            title: '个人中心 | crab-home',
            user: req.session.user,
            photo: req.session.photo,
            typeEditor: req.session.typeEditor,
            email: req.session.email,
            info: req.session.info,
            index: req.session.index,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/personal', function(req,res,next){
        var settingEmail = req.body.settingsEmail;          //form数据
        settingEditor = req.body.optionsRadios,
            settingPhoto = req.body.settingsTempPhoto,
                settingInfo = req.body.settingsInfo,
                    settingIndex = req.body.settingsIndex;
                    settingNowPass = req.body.settingsNowPass;
                    settingNewPass = req.body.settingsNewPass;
                    settingPassAgain = req.body.settingsPassAgain;
                    //头像上传功能刘坑待填
                    settingPhoto = req.session.photo;
                    var NowPassHash = NewPassHash = null;
                    if(settingNowPass == undefined && settingNewPass == undefined && settingPassAgain == undefined){
                        NowPassHash = req.session.password;
                        NewPassHash = req.session.password;
                    }else{
                        NewPassHash = crypto.createHash('md5').update(settingNewPass).digest('hex');
                        NowPassHash = crypto.createHash('md5').update(settingNowPass).digest('hex');
                    }
                    if(NowPassHash != req.session.password){
                        req.flash('error',"当前密码不正确！");
                        return res.redirect('back');
                    }
                    var newUser = new Object();
                    newUser.name = req.session.user;
                    newUser.password = NewPassHash;
                    newUser.email = settingEmail;
                    newUser.photo = settingPhoto;
                    newUser.editor = settingEditor;
                    newUser.info = settingInfo;
                    newUser.index = settingIndex;
                    User.update(newUser,function(err){
                        if(err){
                            req.flash('error',err);
                            return res.redirect('back');
                        }
                        req.session.typeEditor = settingEditor;
                        req.session.info = settingInfo;
                        req.session.index = settingIndex;
                        req.session.password = settingNowPass;
                        req.session.photo = settingPhoto;
                        req.session.password = NewPassHash;
                        req.flash('success','修改成功！');
                        res.redirect('back');
                    });
    });
    app.get('/archive',function(req,res,next){
        var name = req.session.user;
        if(name == null){
            req.flash('error','请登陆！');
            return res.redirect('/login');
        }
        Post.getArchive(name,function(err,posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('archive',{
                title: '归档 | crab-home',
                posts: posts,
                photo: req.session.photo,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/search', function(req,res,next){
        var page = req.query.p?parseInt(req.query.p):1;
        Post.search(req.query.keyword,page,function(err,posts,total){
            if(err){
                posts = [];
                req.flash('error','当前不支持此种查询，请换一种写法！');
                return res.redirect('/');
            }
            res.render('search',{
                title: "SEARCH:" + req.query.keyword,
                posts: posts,
                user: req.session.user,
                photo: req.session.photo,
                page: page,
                isFirstPage: (page-1) == 0,
                isLastPage: ((page-1) * 10 + posts.length) == total,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/u/:name', function(req,res){
        var page = req.query.p?parseInt(req.query.p):1;
        Post.getTen(req.params.name,page, function(err,posts,total){
            if(err){
                posts = [];
                req.flash('error',err);
                return res.redirect('/');
            }
            User.get(req.params.name,function(err,user){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                console.log(user);
                res.render('user', {
                    title: req.params.name + ' | crab-home',
                    posts: posts,
                    page: page,
                    isFirstPage: (page-1) == 0,
                    isLastPage: ((page-1)*10+posts.length) == total,
                    user: req.session.user,
                    name: req.params.name,
                    photo: req.session.photo,
                    index: user.index,
                    email: user.email,
                    info: user.info,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });
    app.get('/links', function(req,res,next){
        res.render('links', {
            title: 'links | crab-home',
            user: req.session.user,
            photo: req.session.photo,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.get('/u/:name/:day/:title', function(req,res,next){
        Post.getOne(req.params.name,req.params.day,req.params.title, function(err,post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('article',{
                title: post.title + ' | crab-home',
                post: post,
                user: req.session.user,
                photo: req.session.photo,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/guest_comment', function(req,res,next){
        /*var date = new Date(),
          time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes(): date.getMinutes()) + ":" + (date.getSeconds()<10?'0'+date.getSeconds(): date.getSeconds());

          var comment = {
name: req.body.name_guest,
time: time,
email:req.body.email_guest,
content: req.body.content_guest
};
var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
newComment.save(function(err){
if(err){
req.flash('error',err);
return res.redirect('back');
}
req.flash('success','留言成功！');
res.redirect('back');
});*/

        req.flash('error',"游客留言功能未完善！");
        return res.redirect('back');
    });
    app.post('/u/:name/:day/:title', function(req,res){
        var date = new Date(),
            time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes(): date.getMinutes()) + ":" + (date.getSeconds()<10?'0'+date.getSeconds(): date.getSeconds());

            var comment = {
                name: req.body.name,
                time: time,
                content: req.body.content
            };
            var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
            newComment.save(function(err){
                if(err){
                    req.flash('error',err);
                    return res.redirect('back');
                }
                req.flash('success','留言成功！');
                res.redirect('back');
            });
    });
    //删除评论
    app.get('/removecomment/:name/:day/:title/:time/:comment_name',checkLogin);
    app.get('/removecomment/:name/:day/:title/:time/:comment_name', function(req,res,next){
        if((req.params.name != req.session.user) && (req.params.comment_name != req.session.user)){
            req.flash('error','您无权访问此页面！');
            return res.redirect('back');
        }
        var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
        Comment.remove(req.params.name,req.params.day,req.params.title,req.params.time, function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','删除成功!');
            res.redirect(url);
        });
    });
    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function(req,res,next){
        if(req.params.name != req.session.user){
            req.flash('error','您无权访问此页面！');
            return res.redirect('back');
        }
        Post.remove(req.params.name,req.params.day,req.params.title, function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','删除成功!');
            var url = encodeURI('/u/' + req.params.name);
            res.redirect(url);
        })
    });
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function(req,res,next){
        if(req.params.name != req.session.user){
            req.flash('error','您无权访问此页面！');
            return res.redirect('back');
        }
        Post.edit(req.params.name,req.params.day,req.params.title, function(err,post){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            res.render('edit',{
                title: '编辑 | crab-home',
                post: post,
                user: req.session.user,
                photo: req.session.photo,
                typeEditor: req.session.typeEditor,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/reprint/:name/:day/:_id',checkLogin);
    app.get('/reprint/:name/:day/:_id', function(req,res,next){
        Post.edit(req.params.name,req.params.day,req.params._id,function(err,post){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            if(req.session.user == req.params.name){
                req.flash('error','您无法转载自己的文章!');
                return res.redirect('back');
            }
            if(post.reprint_info.reprint_from != undefined && req.session.user == post.reprint_info.reprint_from.name){
                req.flash('error',"您无法转载自己的文章！");
                return res.redirect('back');
            }
            var currenUser = req.session.user,
                reprint_from = {name: post.name, day: post.time.day, title: post.title,_id: post._id},
                    reprint_to = {name: currenUser};
                    Post.reprint(reprint_from,reprint_to,function(err,post){
                        if(err){
                            req.flash('error',err);
                            return res.redirect('back');
                        }
                        req.flash('success','转载成功！');
                        var url = encodeURI('/u/'+post.name+'/'+post.time.day+'/'+post._id);
                        res.redirect(url);
                    });
        });
    });
    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function(req,res,next){
        var currenUser = req.session.user;
        Post.update(req.params.name,req.params.day,req.params.title,req.body.post, function(err){
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
            if(err){
                req.flash('error',err);
                return res.redirect(url);
            }
            req.flash('success','修改成功');
            res.redirect(url);
        });
    });

    function checkLogin(req,res,next){
        if(!req.session.teacher){
            req.flash('error','未登录!');
            return res.redirect('/');
        }
        next();
    }
    function checkNotLogin(req,res,next){
        if(req.session.teacher){
            req.flash('error','已登录');
            res.redirect('/');
        }
        next();
    }
    function checkNotLoginStudent(req,res,next){
        if(req.session.student){
            req.flash('error','已登录');
            res.redirect('/student');
        }
        next();
    }
    function checkLoginStudent(req,res,next){
        if (!req.session.student) {
            req.flash('error','未登录！');
            return res.redirect('/');
        }
        next();
    }
};
