# nodejs-serverless
A Node.js app deployed on AWS Serverless architecture


# Working
The Role of API Gateway
AWS API Gateway is a service allowing developers to create and manage HTTP endpoints, map them to particular AWS resources, and configure custom domains, authorizing mechanisms, caching and other features. API Gateway is the fundamental part of serverless API, because it is responsible for the connection between a defined API and the function handling requests to that API.

Sponsor Note
sponsor logo
Thundra is an Application Observability and Security Platform for serverless, container, and VM workloads. Thundra helps to boost developer productivity by quickly pinpointing issues with distributed tracing and production debugging.
HTTP APIs
As mentioned, API Gateway includes a lot of functionality and integrations. At some point, though, Amazon realized that serverless developers usually do not require all of those features, but instead need a general simplification of the implementation process. That is probably why in late 2019, AWS announced the new HTTP APIs, a lite version of API Gateway, which dramatically simplifies the developer experience and provides better performance and lower costs for serverless APIs. Although it is simple, HTTP APIs still support such important features as configuring CORS for all endpoints, JWT integration, custom domains and VPC connections.

Understanding Serverless API Concepts
In order to easily understand the main concepts of serverless API implementation, we’ll build a very minimalistic example of a simple “virtual whiteboard” application, consisting of two simple endpoints: POST for writing messages on a whiteboard, and GET for fetching the three most recent messages. We will also consider other possible features — like path parameters, CORS, and authorizers — but we’ll keep the final implementation simple and clear to read.

AWS DynamoDB
We will make our project completely serverless, by using AWS DynamoDB for storing messages. This database corresponds to serverless principles, is easy to use, and offers a pay-per-request model that is really cost-effective. DynamoDB is a NoSQL key-value database offered by AWS, where your data is stored across AWS servers and fully managed by Amazon.

AWS Serverless Application Model
In order to continue further implementation, you’ll need an AWS account and AWS Serverless Application Model (SAM) installed and configured. SAM is a tool for creating, updating, and managing serverless applications and all the resources needed for the application to operate. With AWS SAM, you don’t need to create every single service manually via web console, but just to describe all the things needed in the special template file.

After you’ve installed the CLI, navigate to the directory you are going to work in and run this command:

$ sam init -r nodejs12.x -n whiteboard
1
$ sam init -r nodejs12.x -n whiteboard
Initializing new project

Select the first option, then select “Quick Start from Scratch.” This will create a “whiteboard” directory with a minimum of setup files inside.

Define the Required Resources Needed
First, open the template.yml file and remove everything below the “Resources” section. Before moving to the API itself, let’s create the secondary resources. Define a DynamoDB table where messages will be stored:

Declaring handlers for POST and GET requests

The above code is quite self-descriptive: two functions, one of which will be invoked upon a POST request to the “/messages” path, and the other of which will be invoked upon a GET request to the same path. Both functions have a capacity of 128 MB RAM and a five-second timeout. The functions’ code is found in the postMessage.js and getMessage.js files under the /src/handlers/ directory. We are going to create those right now. (Note that we’ve provided full access to the DynamoDB in the “Policies” section of each function, just to make things easier.) In a real project, you should consider providing more granular access.

Coding the Functions
Navigate to the /src/handlers directory and create files there with the following content:

postMessage.js

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

exports.handler = async (event) => {
  const { body } = event;
  try {
    const { author, text } = JSON.parse(body);
    if (!author || !text) {
      return {
        statusCode: 403,
        body: 'author and text are required!'
      }
    }

    await dynamodb.putItem({
      TableName: 'board-messages-table',
      Item: {
        msgId: { S: 'board' },
        author: { S: author },
        text: { S: text },
        createdAt: { N: String(Date.now()) } // still expects string!
      }
    }).promise();
    return {
       statusCode: 200,
       body: 'Message posted on board!',
    }
  } catch (err) {
    return {
       statusCode: 500,
       body: 'Something went wrong :(',
    }
  }
};
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
 
exports.handler = async (event) => {
  const { body } = event;
  try {
    const { author, text } = JSON.parse(body);
    if (!author || !text) {
      return {
        statusCode: 403,
        body: 'author and text are required!'
      }
    }
 
    await dynamodb.putItem({
      TableName: 'board-messages-table',
      Item: {
        msgId: { S: 'board' },
        author: { S: author },
        text: { S: text },
        createdAt: { N: String(Date.now()) } // still expects string!
      }
    }).promise();
    return {
       statusCode: 200,
       body: 'Message posted on board!',
    }
  } catch (err) {
    return {
       statusCode: 500,
       body: 'Something went wrong :(',
    }
  }
};
POST request handler’s code

This function will run in response to POST requests and will parse the author and text of the message from the request body and save that data into the database. It also fills the “partKey” attribute with the same value for all records. Although usually this is not a good practice, it is completely fine for this example, as it allows you to sort by range key among all items with the same partition key. Note that DynamoDB always expects string data to be saved, even if the type of attribute is a number.

getMessages.js

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

exports.handler = async () => {
  try {
    const result = await dynamodb.query({
      TableName: 'board-messages-table',
      KeyConditionExpression: 'partKey = :partKey',
      ScanIndexForward: false,
      Limit: 3,
      ExpressionAttributeValues: {':partKey': { S: 'board'}}
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.Items),
    }
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: 'Something went wrong :(',
    }
  }
};
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
 
exports.handler = async () => {
  try {
    const result = await dynamodb.query({
      TableName: 'board-messages-table',
      KeyConditionExpression: 'partKey = :partKey',
      ScanIndexForward: false,
      Limit: 3,
      ExpressionAttributeValues: {':partKey': { S: 'board'}}
    }).promise();
 
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.Items),
    }
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: 'Something went wrong :(',
    }
  }
};
GET request handler’s code

In this function we first get records with “partKey” equal to “board,” then use “ScanIndexForward” set to “false” to sort messages so that the most recent is first, and finally we use the “Limit” property to limit results to three messages.

Deployment
Deployment with AWS SAM is easy and can be done with a single command and a few inputs. Navigate to the root directory of the project and run the following command:

$ sam deploy --guided
1
$ sam deploy --guided
Deployment command

You will then be asked to enter the name of your app and the AWS region to use. You’ll also need to confirm some actions:


Fill in and accept settings

After you’ve completed all the confirmations, deployment will start, and you’ll see all the resources being created. This takes about a minute or less.


List of resources to be created and their statuses

When the process is finished, open the AWS web console in your browser, navigate to API Gateway service, find the newly created API, and copy the URL to the root endpoint of your API.


![Alt text](whiteboard/images/deployed.jpg?raw=true "Title"))
![Alt text](whiteboard/images/apideployed.jpg?raw=true "Title"))