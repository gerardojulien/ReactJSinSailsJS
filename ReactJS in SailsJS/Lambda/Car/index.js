var mysql = require('mysql');
var request = require('request');
var config = require('config.json');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const AWS = require('aws-sdk');
//var gm = require('gm')
//           .subClass({ imageMagick: true }); // Enable ImageMagick integration.
var async = require('async');
const sharp = require('sharp');


const fileType = require('file-type');


function Car() {
    this.CarId = "";
    this.CarName = "";
    this.CarDescription = "";
    this.CarImageUrl = "";
    this.CarCreatedDate = "";
}

function Response(){
  this.Message = "Ok";
  this.Car = new Car();
  this.Error = "";
}
var MAX_WIDTH  = 128;

exports.handler = (event, context, callback) => {
    // TODO implement
    console.log('Loading function');
    // console.log('event: ' + event);
    const operation = event['httpMethod']
    console.log('operation: ' + operation);
    var message_response = new Response();
    message_response.Car = new Car();
    try {
        
        var connection = mysql.createConnection({
            "host"     : config.host,
            "user"     : config.user,
            "password" : config.password,
            "port"     : config.port,
            "database" : config.database
        });

        if (operation == 'GET') {
            console.log('GET Init.');
            if (event['queryStringParameters'] == null ||
            event['queryStringParameters']['CarId'] == null ||
            event['queryStringParameters']['CarId'] == 'undefined' ||
            event['queryStringParameters']['CarId'] == '') {
                var err = new Error('Id required.');
                throw err;
            }
            var carId = event['queryStringParameters']['CarId']
            connection.connect();
            carId = connection.escape(carId);
            console.log('carId: ', carId);
            var sql = "SELECT * FROM Cars WHERE CarId = " + carId ;
            console.log('sql: ', sql);
            var params = [];
            connection.query(sql, params, (err, results) => {
                connection.end();
                if (err){
                    console.log("err: ", err);
                    var err = new Error('Query error.');
                    throw err;
                }
                else {
                    console.log('len', results.length);
                    if (results.length == 1) {
                        message_response.Car.CarId = results[0].CarId;
                        message_response.Car.CarName = results[0].CarName;
                        message_response.Car.CarDescription = results[0].CarDescription;
                        message_response.Car.CarImageUrl = results[0].CarImageUrl;
                        message_response.Car.CarCreatedDate = results[0].CarCreatedDate;
                        const response = {
                            statusCode: 200,
                            body: JSON.stringify(message_response),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        };
                        
                        callback(null, response);
                    }
                    else {
                        var err = new Error('Id not found.');
                        throw err;
                    }
                    console.log("Data: ", results);
                }
            }); 
        }
        else if (operation == 'POST') {
            console.log('POST Init.');
            console.log('event[body]: ', event['body']);
            if (event['body'] == null) {
                throw new Error('Data required.');
            }
            let parametersList = event['body'].split('&')
            let paramLen = parametersList.length;
            var carName = "";
            var carDescription = "";
            var carImage = "";
            for(var i = 0; i < paramLen; i++) {
                let subparam = parametersList[i].split('=')
                console.log('subparam[0]: ', subparam[0]);
                if (subparam[0] == 'CarName') {
                    carName = subparam[1];
                }
                else if (subparam[0] == 'CarDescription') {
                    carDescription = subparam[1];
                }
                else if (subparam[0] == 'CarImage') {
                    carImage = subparam[1];
                }
            }
            if (carName == null || carName == '' ||
            carDescription == null || carDescription == '' ||
            carImage == null || carImage == '') {
                throw new Error('Data required');
            }
            var carId = uuidv4();

            connection.connect();
            carName = connection.escape(decodeURIComponent(carName));
            carDescription = connection.escape(decodeURIComponent(carDescription));

            let now = moment().format('YYYY-MM-DD HH:mm:ss');
            
            carImage = decodeURIComponent(carImage);

            let buffer = new Buffer(carImage, 'base64');
            console.log("buffer", buffer);

            let fileMime = fileType(buffer);
            
            if (fileMime == null) {
                throw new Error('Image error.');
            }
            let fileExt = fileMime.ext;
            
            let uuid4Str = uuidv4();
            let filePath = 'images/large/';
            let fileName = uuid4Str + '.' + fileExt;
            let fileFullName = filePath + fileName;
            let fileFullPath = 'https://s3.us-east-2.amazonaws.com/' + config.aws_bucket_name + '/' + fileFullName;

            let filePathSmall = 'images/small/';
            let fileFullNameSmall = filePathSmall + fileName;
            let fileFullPathSmall = 'https://s3.us-east-2.amazonaws.com/' + config.aws_bucket_name + '/' + fileFullNameSmall;

            let params = {
                Bucket: config.aws_bucket_name,
                Key: fileFullName,
                Body: buffer,
                ACL: 'public-read'
            };

            const s3 = new AWS.S3({
                accessKeyId: config.aws_access_key,
                secretAccessKey: config.aws_secret_access_key
            });

            s3.upload(params, function(error, data) {
                if (error) {
                    console.log("s3.error: ", error);
                    throw new Error('Server error.');
                }
                else {
                    console.log('url: ', fileFullPath);
                    console.log('data: ', data);
                }
            });

            sharp(buffer).resize(MAX_WIDTH).toBuffer()
            .then(function(data) {
                let paramsSmall = {
                    Bucket: config.aws_bucket_name,
                    Key: fileFullNameSmall,
                    Body: data,
                    ACL: 'public-read'
                };
                s3.upload(paramsSmall, function(error, data) {
                    if (error) {
                        console.log("s3.error: ", error);
                        throw new Error('Server error.');
                    }
                    else {
                        console.log('url: ', fileFullPathSmall);
                        console.log('data: ', data);
                    }
                });
                return [data, sharp(data).metadata()];
            });

            var query = "INSERT INTO Cars VALUES ('" +
             carId + "', " + carName + ", " + 
             carDescription + ", '" + fileName + "', '" + now + "')";
            connection.query(query, [], function (error, results, fields) {
                connection.end();
                console.log('results: ', results);
                if (error){
                    console.log("err: ", err);
                    var err = new Error('Query error.');
                    throw err;
                }
                else {
                    message_response.Car = null;
                    const response = {
                        statusCode: 200,
                        body: JSON.stringify(message_response),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    };
                    console.log('POST Response');
                    callback(null, response);
                }
            });
        }
        else {
            var err = new Error('Unsupported Method');
            throw err;
        }
    }
    catch(error) {
        console.log('error: ', error);
        message_response.Message = 'error';
        message_response.Car = null;
        message_response.Error = error.message;
        const response = {
            statusCode: 200,
            body: JSON.stringify(message_response),
            headers: {
                'Content-Type': 'application/json'
            }
        };
        callback(null, response);
    }
    finally {

    }
};
