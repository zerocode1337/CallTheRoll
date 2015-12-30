var Db = require('./db.js');
var poolModule = require('generic-pool');
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
function Student(student) {
    this.name = student.name
   ,this.email = student.email
   ,this.realName = student.realName
   ,this.password = student.password
   ,this.no_id = student.no_id
   ,this.major = student.major
   ,this.dept = student.dept
};

module.exports = Student;

Student.prototype.save = function(callback) {
    var student= {
        name: this.name,
        password: this.password,
        email: this.email,
        realName: this.realName,
        no_id: this.no_id,
        majors:this.major,
        dept: this.dept
    };
    pool.acquire(function(err,mongodb){
        if(err){
            return callback(err);
        }
        mongodb.collection('student', function(err,collection){
            if (err) {
                pool.release(mongodb);
                return callback(err);
            }
            collection.insert(student,{
                safe: true
            }, function(err,user){
                pool.release(mongodb);
                if (err) {
                    return callback(err);
                }
                callback(null,user);
            });
        });
    });
};
Student.get = function(name,callback){
    pool.acquire(function(err,mongodb){
        if (err) {
            return callback(err);
        }
        mongodb.collection('student', function(err,collection){
            if(err){
                pool.release(mongodb);
                return callback(err);
            }
            collection.findOne({
                name:name
            },function(err,user){
                pool.release(mongodb);
                if(err){
                    return callback(err);
                }
                callback(null,user);
            });
        });
    });
};
Student.update = function(student,callback){
    pool.acquire(function(err,mongodb){
        if (err) {
            return callback(err);
        }
        mongodb.collection('student', function(err,collection){
            if(err){
                pool.release(mongodb);
                return callback(err);
            }
            collection.update({
                'name': student.name
            },{$set:{
                'email': student.email,
                'password': student.password,
                'realName': stduent.realName,
                'no_id': student.no_id,
                'major': student.major,
                'dept': student.dept
            }},function(err){
                pool.release(mongodb);
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};
