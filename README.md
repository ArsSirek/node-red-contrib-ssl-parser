this module uses Nodejs native module node:https to attempt to make an https request if passed without error returns the cert details if not empty object


# usage
the response payload will have status field with possible values
 - 'success' ssl is valid
 - 'expired' expired may be returned even if the cert never existed
 - 'fail' some other error, please read the debug error messages for details
