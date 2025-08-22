// hash.js
const bcrypt = require('bcrypt');

bcrypt.hash('admin1!', 10).then(hash => {
    console.log(hash);
});
