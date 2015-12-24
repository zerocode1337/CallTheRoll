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
function Teacher(teacher) {
    this.name = teacher.name
   ,this.email = teacher.email
   ,this.realName = teacher.realName
   ,this.password = teacher.password
};

module.exports = Teacher;

Teacher.prototype.save = function(callback) {
    var teacher = {
        name: this.name,
        password: this.password,
        email: this.email,
        realName: this.realName,
        majors: []
    };
    pool.acquire(function(err,mongodb){
        if(err){
            return callback(err);
        }
        mongodb.collection('teacher', function(err,collection){
            if (err) {
                pool.release(mongodb);
                return callback(err);
            }
            collection.insert(teacher,{
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
Teacher.get = function(name,callback){
    pool.acquire(function(err,mongodb){
        if (err) {
            return callback(err);
        }
        mongodb.collection('teacher', function(err,collection){
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
Teacher.update = function(teacher,callback){
    pool.acquire(function(err,mongodb){
        if (err) {
            return callback(err);
        }
        mongodb.collection('teacher', function(err,collection){
            if(err){
                pool.release(mongodb);
                return callback(err);
            }
            collection.update({
                'name': teacher.name
            },{$set:{
                'email': teacher.email,
                'password': teacher.password,
                'realName': teacher.realName,
                'majors': teacher.majors
            }},function(err){
                pool.release(mongodb);
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}
