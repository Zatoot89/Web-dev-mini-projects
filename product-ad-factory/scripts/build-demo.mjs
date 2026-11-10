import {mkdirSync,writeFileSync} from 'node:fs';
await import('./make-music.mjs');
const props={
  brand:'DEMO STUDIO',
  title:'Everyday Ceramic Mug',
  claims:['Comfortable handle','Classic ceramic finish','Enjoy every sip'],
  language:'en',
  color:'#3C82F6',
  website:'example.com',
  image:'demo-cup.svg',
};
mkdirSync('out',{recursive:true});
writeFileSync('out/demo-props.json',JSON.stringify(props,null,2)+'\n');
console.log('Demo input props ready; illustration is fictional');
