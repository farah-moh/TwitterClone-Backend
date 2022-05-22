const {faker} = require('@faker-js/faker');
const { ObjectId } = require('mongoose').Types;


module.exports = (userIds) => {
    const usersCount = userIds.length;
    const tweetsObjects = [];
    const favoriters = userIds.slice(3,6);
    const retweeters = userIds.slice(6,9);
    for (let i = 0; i < 3; i += 1) {
      const tweetsObject = {
        user: userIds[i % usersCount],
        body: faker.lorem.words(6),
        favoriters: favoriters.map(el => new ObjectId(el)),
        retweeters: retweeters.map(el => new ObjectId(el)),
      };
  
      tweetsObjects.push(tweetsObject);
    }
  
    return tweetsObjects;
  };