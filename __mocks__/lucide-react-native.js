const React = require('react');
const Icon = props => React.createElement('Icon', props);
module.exports = new Proxy({}, { get: () => Icon });
