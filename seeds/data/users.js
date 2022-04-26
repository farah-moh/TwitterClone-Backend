const {faker} = require('@faker-js/faker');

module.exports = () => {
    const userObjects = [];
  
    for (let i = 0; i < 5; i +=1) {
      const userObject = {
        name: `user${i}`,
        email: `user${i}@gmail.com`,
        password: 'password',
        image: faker.image.avatar(),
        username: `user${i}`,
        birthdate: '2001-09-12',
        confirmed: true,
        country: 'Egypt',
        city: 'Cairo',
        bio: `I am user${i}`
      };
      userObjects.push(userObject);
    }
  
    for (let i = 0; i < 5; i += 1) {
      const userObject = {
        name: `user${i+5}`,
        email: `user${i+5}@gmail.com`,
        image: faker.image.avatar(),
        password: 'password',
        username: `user${i+10}`,
        birthdate: '2001-09-12',
        confirmed: true,
        country: 'Egypt',
        city: 'Cairo',
        bio: `I am user${i+5}`,
        protectedTweets: true
      };
      userObjects.push(userObject);
    }
  
    return  userObjects ;
  };