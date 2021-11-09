const express = require('express');
const app = express();
const port = 3333;
const {v4: uuidv4} = require('uuid');

app.use(express.json());

const accounts = [];


//Middlewares

function verifyExistsAccountCpf (req, res, next){

    const { cpf } = req.headers;

    const account = accounts.find(account => account.cpf === cpf);

    if(!account){
        return res.status(400).json({error: "is account does not exists"});
    }

    req.account = account;

    return next();

}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        
        if(operation.type === "credit"){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }

    }, 0)

    return balance;
}


//Routes

app.post("/create", (req, res) => {
    const { cpf, name } = req.body;

    
    const alreadyUserExists = accounts.find(accounts => accounts.cpf === cpf);

    if(alreadyUserExists){
        return res.status(400).json({error: "User Already Exists"});
    }

    accounts.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    })

    console.log(accounts);


    return res.status(201).json(accounts);
        
});

app.get("/statement", verifyExistsAccountCpf, (req, res) => {
    const { account } = req;

    return res.json(account.statement);
})

app.post("/deposit", verifyExistsAccountCpf, (req, res) => {
    const { description, amount} = req.body;
    const { account } = req;
    const operation = {

        description,
        amount,
        operation_date: new Date(),
        type: "credit"
    }

    account.statement.push(operation);

    return res.status(201).json({message: "successful deposit"});
});

app.post("/withdraw", verifyExistsAccountCpf, (req, res) => {
    const { account } = req;
    const { amount } = req.body;
    const balance = getBalance(account.statement);

    if(balance < amount){

        return res.status(400).json({message: "insufficient funds"});
    }

    const statementOperation = {

        amount,
        operation_date: new Date(),
        type: "debit"
    }

    account.statement.push(statementOperation);

    return res.status(201).json({message: "successful withdrawal"})


})

app.get("/statement/date", verifyExistsAccountCpf, (req, res) => {
    const { account } = req
    const { date } = req.query;
    const dateFormat = new Date(date + " 00:00");


    const statement = account.statement.filter(
        (statement) =>
        statement.operation_date.toDateString() ===
        new Date(dateFormat).toDateString()
    );


    console.log(date);
    return res.json(statement);
});

app.put("/account", verifyExistsAccountCpf, (req, res) => {
    const { name } = req.body;
    const { account } = req;

    account.name = name;

    return res.status(201).json(name);

})

app.delete("/account", verifyExistsAccountCpf, (req, res) => {
    const { account } = req;

    const index = accounts.indexOf(account);

    if( index > -1){
        accounts.splice(index, 1);
    }
    

    return res.status(200).json(account);

})
















app.listen(port, () => console.log('server is running'));