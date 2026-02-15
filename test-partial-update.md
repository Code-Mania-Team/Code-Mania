# Partial Update Examples for Exercise API

## Endpoint
```
PATCH /v1/admin/exercises/:id
```

## Example 1: Update only title
```json
{
  "title": "New Updated Title"
}
```

## Example 2: Update only description and task
```json
{
  "description": "Updated description here",
  "task": "Updated task instructions"
}
```

## Example 3: Update only experience points
```json
{
  "experience": 150
}
```

## Example 4: Update multiple fields
```json
{
  "title": "Updated Title",
  "experience": 200,
  "validation_mode": "strict"
}
```

## Response
```json
{
  "success": true,
  "message": "Exercise updated successfully",
  "data": {
    "id": 123,
    "title": "Updated Title",
    "description": "Original description (unchanged)",
    "task": "Original task (unchanged)",
    "experience": 200,
    "validation_mode": "strict",
    "updated_at": "2024-02-16T02:30:00.000Z"
  }
}
```

## Error Cases

### No fields provided
```json
{}
```
Response:
```json
{
  "success": false,
  "message": "No fields provided for update"
}
```

### Invalid exercise ID
```
PATCH /v1/admin/exercises/999999
```
Response:
```json
{
  "success": false,
  "message": "Exercise not found'
}
```
