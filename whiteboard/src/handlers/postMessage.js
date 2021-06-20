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