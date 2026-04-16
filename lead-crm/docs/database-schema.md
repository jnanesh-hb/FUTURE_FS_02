# Database Schema

## User

```js
{
  name: String,
  email: String,
  password: String,
  role: 'admin' | 'user',
  createdAt: Date,
  updatedAt: Date
}
```

## Lead

```js
{
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  company: String,
  message: String,
  source: 'Website' | 'Email' | 'Phone' | 'Referral' | 'Social Media' | 'Other',
  status: 'New' | 'Contacted' | 'In Progress' | 'Converted' | 'Closed',
  leadScore: Number,
  assignedTo: ObjectId<User> | null,
  statusHistory: [
    {
      from: String | null,
      to: String,
      changedBy: ObjectId<User> | null,
      changedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## FollowUp

```js
{
  leadId: ObjectId<Lead>,
  userId: ObjectId<User>,
  type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Task' | 'Other',
  description: String,
  scheduledDate: Date | null,
  completedDate: Date | null,
  status: 'Pending' | 'Completed' | 'Cancelled',
  outcome: String,
  createdAt: Date,
  updatedAt: Date
}
```
