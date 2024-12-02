import { Meteor } from 'meteor/meteor'
import { LinksCollection } from '/imports/api/links'
import '/imports/api/logger';
import '/imports/api/logger.server';
import '/imports/api/linksPub'

async function insertLink({ title, url }: { title: string, url: string }) {
  await LinksCollection.insertAsync({title, url, createdAt: new Date()})
}

Meteor.startup(async () => {
  // If the Links collection is empty, add some data.
  if (await LinksCollection.find().countAsync() === 0) {
    await insertLink({
      title: 'Do the Tutorial',
      url: 'https://www.meteor.com/tutorials/react/creating-an-app'
    })

    await insertLink({
      title: 'Follow the Guide',
      url: 'http://guide.meteor.com'
    })

    await insertLink({
      title: 'Read the Docs',
      url: 'https://docs.meteor.com'
    })

    await insertLink({
      title: 'Discussions',
      url: 'https://forums.meteor.com'
    })
  }
  
  console.log(`Meteor server started up successfully: ${Meteor.absoluteUrl()}`)
})
