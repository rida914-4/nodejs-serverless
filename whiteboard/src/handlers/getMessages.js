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