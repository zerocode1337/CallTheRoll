var Db = require('./db.js');
var poolModule = require('generic-pool');
var ObjectID = require('mongodb').ObjectID;
var pool = poolModule.Pool({
    name: 'mongoPool',
    create: function(callback){
        var mongodb = Db();
        mongodb.open(function(err,db){
            callback(err,db);
        });
    },
    destroy: function(mongodb){
        mongodb.close();
    },
    max: 100,
    min: 5,
    idleTimeoutMillis: 30000,
    log: true
});
function Course(course) {
    this.course_name = course.name;
    this.course_period = course.period;
    this.course_teacher = course.teacher;
    this.course_dept = course.dept;
    this.major = course.major;
    this.course_password = course.coursePassword;
}

module.exports = Course;

Course.prototype.save = function(callback) {
    //生成时间
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " +		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes(): date.getMinutes())
    }
    //存储结构
    var course = {
        course_name: this.course_name,
        course_period: this.course_period,
        course_teacher: this.course_teacher,
        course_dept: this.course_dept,
        course_major: this.major,
        course_time: time,
        course_password: this.course_password,
        course_students: []
    };
    console.log(course);
    pool.acquire(function(err,mongodb){
        if(err){
            return callback(err);
        }
        mongodb.collection('course', function(err,collection){
            if(err){
                pool.release(mongodb);
                return callback(err);
            }
            collection.insert(course,{
                safe:true
            }, function(err){
                pool.release(mongodb);
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

Course.getAll = function(name,callback){
    pool.acquire(function(err,mongodb){
        if (err) {
            return callback(err);
        }
        mongodb.collection('course',function(err,collection){
            if (err) {
                pool.release(mongodb);
                return callback(err);
            }
            var query = {};
            if(name){
                query.course_teacher = name;
            }
            collection.find(query).sort({course_time:-1}).toArray(function(err,docs){
                pool.release(mongodb);
                if (err) {
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
};

Course.remove = function(_id,callback){
    pool.acquire(function(err,mongodb){
        if (err) {
            return callback(err);
        }
        mongodb.collection('course', function(err,collection){
            if (err) {
                pool.release(mongodb);
                return callback(err);
            }
            collection.remove({
                '_id': new ObjectID(_id)
            },{w:1},function(err){
                 pool.release(mongodb);
                 if(err){
                     return callback(err);
                 }
                 callback(null);
            });
        });
    });
};

