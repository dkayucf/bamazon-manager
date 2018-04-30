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
                    console.log(`\n ### Welcome ${userName}, you are now logged in to Bamazons Manager Suite. ### \n`);
                    managerPromptInit(userName);
                    
                }
            });
        }
         
    });
}

function managerPromptInit(userName){
    inquirer.prompt([
        {
            type: 'list',
            name: 'selectOption',
            message: `\n How may I help you today ${userName}?`,
            choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add new product', 'I am done for the day']
        }
    ])
    .then(answers => {
        switch(answers.selectOption) {
            case 'View Products for Sale':
                displayTableInit(false, true, userName);
                break;
            case 'View Low Inventory':
                lowInvItems(userName);
                break;
            case 'Add to Inventory':
                addInventory(userName);
                break;
            case 'Add new product':
                departmentChoices(userName);
                break;
            case 'I am done for the day':
                console.log('\nHave a great day! I look forward to seeing you soon.\n')
                connection.end();
                break;
        }
    });
}

function departmentChoices(userName){

        connection.query(`SELECT department_name FROM products`, function (error, results, fields) {
            if (error) throw error;           
                let choices = results.map(x => x.department_name).filter((item, pos, self) => self.indexOf(item) == pos);

                addProduct(userName, choices)
        });
}


function addProduct(userName, choices){
    inquirer.prompt([
        {
            type: 'input',
            name: 'product_name',
            message: 'What is the name of the product you would like to add?'
        },
        {
            type: 'list',
            name: 'department_name',
            message: 'What department is this product located in?',
            choices: choices
        },
        {
            type: 'input',
            name: 'price',
            message: 'How much do they cost?'
        },
        {
            type: 'input',
            name: 'stock_quantity',
            message: 'How many are in stock?'
        }
    ])
    .then(answers => {
        
        connection.query('INSERT INTO products SET ?', answers, function (error, results, fields) {

            console.log(`\n ${answers.stock_quantity} ${answers.product_name} were added to your inventory.\n`);
            
            displayTableInit(false, true, userName);

              
        });   
    });
}

function lowInvItems(userName){
    connection.query('SELECT * FROM products WHERE stock_quantity <= 5', function (error, results, fields) {
          if (error) throw error;
            console.table(results);
            inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'addInventory',
                    message: 'These items have low inventory levels. \n Would you like me to add some inventory for you?'
                }
            ])
            .then(answers => {
                if(answers.addInventory){
                    addInventory(userName);
                }else{
                    managerPromptInit(userName);
                }
            });
     }); 
}


function addInventory(userName){
    inquirer.prompt([
        {
            type: 'input',
            name: 'productId',
            message: 'Which inventory item_id would you like me to add inventory to?'
        },
        {
            type: 'input',
            name: 'qtyAdded',
            message: 'How many inventory units shall I add?'
        }
    ])
    .then(answers => {
        connection.query(`SELECT * FROM products WHERE item_id = ${answers.productId}`, function (error, results, fields) {

            if (error) throw error;           
                let stockQty = parseInt(results[0].stock_quantity);
                let QTYAdded = parseInt(answers.qtyAdded);
                let productName = results[0].product_name;
                
            connection.query(`UPDATE products SET stock_quantity = ${stockQty + QTYAdded} WHERE item_id = ${answers.productId} `, function (error, results, fields) {
                if (error) throw error;
                console.log(`${QTYAdded} units of ${productName} were added to your inventory. \n New Total Qty: ${stockQty + QTYAdded}\n`);
                displayTableInit(false, true, userName);
            });  
              
        });
        
        
        
    });
}

function displayTableInit(continuePrompt, managerPrompt, userName){
    if(continuePrompt){
        connection.query('SELECT * FROM products', function (error, results, fields) {
          if (error) throw error;
            console.table(results);
            continueShopPrompt();
        });    
    }else if(managerPrompt){
        connection.query('SELECT * FROM products', function (error, results, fields) {
          if (error) throw error;
            console.table(results);
            managerPromptInit(userName);
        }); 
    }else {
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