var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/claytonleonardcook/rc2encryption.git', // Update to point to your repository  
        user: {
            name: 'Clayton Cook', // update to use your name
            email: 'claytonleonardcook@protonmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
