# POST application/create

## Is required authorization
- Yes

### Required permissions
- internal
- dev-center

## Parameters
- name
- description
- permissions

### Parameter: permissions
Permissions are defined by listing thier name separated by commas.

## Return
Application object

# POST application/application-key/generate

## Is required authorization
- Yes

### Required permissions
- internal
- dev-center

## Parameters
- application-id

## Return
application-key

# GET application/application-key

## Is required authorization
- Yes

### Required permissions
- internal
- dev-center

## Parameters
- application-id

## Return
application-key
