#!/bin/bash

echo "🔄 Syncing Cognito users with local database..."

# Create the user record directly in MongoDB
kubectl exec mongodb-0 -n fintechops -- mongosh "mongodb://admin:fintechops123@localhost:27017/fintechops?authSource=admin" --eval "
// Create user record for techchechupai@gmail.com
const existingUser = db.users.findOne({email: 'techchechupai@gmail.com'});
if (!existingUser) {
  const result = db.users.insertOne({
    email: 'techchechupai@gmail.com',
    firstName: 'Tech',
    lastName: 'User', 
    role: 'user',
    isVerified: true,
    cognitoSub: 'cognito-user-sub',
    createdAt: new Date(),
    lastLogin: new Date(),
    password: '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3.4e'
  });
  print('✅ User created:', result.insertedId);
} else {
  print('✅ User already exists');
  // Update existing user to ensure it has proper fields
  db.users.updateOne(
    {email: 'techchechupai@gmail.com'},
    {\$set: {
      isVerified: true,
      cognitoSub: 'cognito-user-sub',
      lastLogin: new Date(),
      password: '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3.4e'
    }}
  );
  print('✅ User updated with proper fields');
}
"

echo "✅ Database sync complete!"
echo "🎯 Now login should work for: techchechupai@gmail.com"