const mysql = require('mysql');
const inquirer = require('inquirer');
const cTable = require('console.table');


var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId + "\n");
    customerCheck();
});

function customerCheck(){
    inquirer.prompt([
        {
            type: 'confirm',
            name: 'customerCheck',
            message: 'Are you a customer?'
        }
    ])
    .then(answers => {
        if(answers.customerCheck){
            displayTableInit();
        }else{
            managerCredentials();
        }
    });
}


function managerCredentials(){
    console.log('Enter your credentials');
    
    inquirer.prompt([
        {
            type: 'input',
            name: 'userName',
            message: 'Username (demo):',
            validate: function(input){
                return input !== '';
            }
        },
        {
            type: 'password',
            name: 'password',
            mask: '*',
            message: 'Password (pass):',
            validate: function(input){
                return input !== '';
            }
        }
    ])
    .then(answers => {
  
        let userName = answers.userName;
        let password = answers.password;
        if(userName && password){
            connection.query(`SELECT * FROM users WHERE user_name = '${userName}' AND  user_pass = '${password}'`, function (error, results, fields) {
               if(error) throw error;
                if(results.length === 0){
                    console.log('Incorrect Credentials. Please Try again.');
                    managerCredentials();
                }else{
                    managerPromptInit(userName);
                }
            });
        }
         
    });
}

function managerPromptInit(userName){
    console.log(`\n ### Welcome ${userName}, you are now logged in to Bamazons Manager Suite. ### \n`);
    inquirer.prompt([
        {
            type: 'list',
            name: 'selectOption',
            message: `How may I help you today ${userName}?`,
            choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add new product']
        }
    ])
    .then(answers => {
        console.log(answers);
    });
}

function displayTableInit(continuePrompt){
    if(continuePrompt){
        connection.query('SELECT * FROM products', function (error, results, fields) {
          if (error) throw error;
            console.table(results);
            continueShopPrompt();
        });    
    }else{
        connection.query('SELECT * FROM products', function (error, results, fields) {
          if (error) throw error;
            console.table(results);
            initialPrompt();
        });    
    }
    
}

function continueShopPrompt(){
    inquirer.prompt([
        {
            type: 'confirm',
            name: 'continueShopping',
            message: 'Would you like to continue shopping at bamazon?'
        }
    ])
    .then(answers => {
        if(answers.continueShopping){
            initialPrompt();
        }else{
            console.log('Have a Great Day! Look forward to seeing you soon.')
            connection.end();
        }
    });
}


function initialPrompt(){
    inquirer.prompt([
        {
            type: 'input',
            name: 'productID',
            message: 'What product ID would you like to buy?'
        },
        {
            type: 'input',
            name: 'quantityPurchase',
            message: 'How many units would you like to purchase?'
        }
    ])
    .then(answers => {
        let productId = answers.productID;
        let purchQty = answers.quantityPurchase;
        checkProductQTY(productId, purchQty);
    });
}

function insufficientQuantityPrompt(productId){
    inquirer.prompt([
        {
            type: 'input',
            name: 'quantityPurchase',
            message: 'How many units would you like to purchase?'
        }
    ])
    .then(answers => {
        let purchQty = answers.quantityPurchase;
        checkProductQTY(productId, purchQty);
    });
}

function checkProductQTY(productId, purchQty){
    connection.query(`SELECT stock_quantity FROM products WHERE item_id = ${productId}`, function (error, results, fields) {
      if (error) throw error;
        if(purchQty > results[0].stock_quantity){
            console.log(`############## Insufficient Quantity Available. There are ${results[0].stock_quantity} in stock. ##############`);
            insufficientQuantityPrompt(productId);
        } else {
            let stockQty = results[0].stock_quantity
            updateStockQty(productId, purchQty, stockQty);
        }
    });
}

function updateStockQty(productId, purchQty, stockQty){
    connection.query(`UPDATE products SET stock_quantity = ${stockQty - purchQty} WHERE item_id = ${productId} `, function (error, results, fields) {
      if (error) throw error;
        console.log('Transaction Complete. Thanks for doing business with Bamazon!');
        let continuePrompt = true;
        displayTableInit(continuePrompt);
    });
}