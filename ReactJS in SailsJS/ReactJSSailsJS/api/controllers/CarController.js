/**
 * CarController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var request = require('request');

module.exports = {
  
    list:function(req, res){
        console.log('CarController.list');

        request.get({
            url: "https://lambda/cars"
          }, function(error, response, body) {
            if (error) {
              sails.log.error(error);
              res.view('list', {error: "Error"});
            }
            else {
              // sails.log.info(response);
              var serviceResponse = JSON.parse(body);
              sails.log.info('body.Cars:', body.Cars);
              sails.log.info(body);
              sails.log.info('Cars:', serviceResponse.Cars);
              if (serviceResponse.Cars != null) {
                // var carsLen = serviceResponse.Cars.lenght;
                // for (var i = 0; i < carsLen; i++) ~~

                // car.CarId = serviceResponse.C
                sails.log.info('NOT NULL');
                res.view('list', {cars:serviceResponse.Cars});

                // var x = '[{"row": "Leer la documentación"},{"row": "Completar Tutoriales"}]';
                // var xjson = JSON.parse(x); 
                // res.view('list', {cars:xjson});

              }
                else {
                    res.view('list', {cars:[]});
                }

            }
          });

    },
    send:function(req, res){
      console.log('CarController.send');
      console.log('req.body: ', req.body);
      // console.log('res: ', res);

      request.post({
          url: "https://lambda/car",
          body: "CarName=" + req.body.CarName + "&CarDescription=" + req.body.CarDescription + "&CarImage=" + req.body.CarImage 
        }, function(error, response, body) {
          if (error) {
            sails.log.error(error);
            res.view('list', {error: "Error"});
          }
          else {
            console.log("response: ", response);
            res.view('list', {cars:[]});
          }
        });

     },
};

