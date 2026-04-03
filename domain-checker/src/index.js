const { app } = require('@azure/functions');
require('./functions/domainChecker');
require('./functions/checkAllowedAccess');