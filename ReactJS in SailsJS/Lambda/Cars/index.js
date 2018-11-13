var mysql = require('mysql');
var config = require('config.json');

function Car() {
    this.CarId = "";
    this.CarName = "";
    this.CarDescription = "";
    this.CarImageUrl = "";
    this.CarCreatedDate = "";
}

function Response(){
  this.Message = "Ok";
  this.Cars = [new Car()];
  this.Error = "";
}

exports.handler = (event, context, callback) => {
    
    console.log('Loading function');
    // console.log('event: ' + event);
    const operation = event['httpMethod']
    console.log('operation: ' + operation);
    var message_response = new Response();
    message_response.Cars = [new Car()];
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
            connection.connect();
            var sql = "SELECT * FROM Cars ORDER BY CarName";
            console.log('sql: ', sql);
            connection.query(sql, [], (err, results) => {
                connection.end();
                if (err){
                    console.log("err: ", err);
                    var err = new Error('Query error.');
                    throw err;
                }
                else {
                    var resultsLen = results.length;
                    console.log('len', resultsLen);
                    if (resultsLen >= 1) {
                        for (var i = 0; i < resultsLen; i++) {
                            message_response.Cars[i] = new Car();
                            message_response.Cars[i].CarId = results[i].CarId;
                            message_response.Cars[i].CarName = results[i].CarName;
                            message_response.Cars[i].CarDescription = results[i].CarDescription;
                            message_response.Cars[i].CarImageUrl = results[i].CarImageUrl;
                            message_response.Cars[i].CarCreatedDate = results[i].CarCreatedDate;
                        }
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
                        var err = new Error('Cars not found.');
                        throw err;
                    }
                    console.log("Data: ", results);
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
