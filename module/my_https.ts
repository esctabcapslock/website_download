import * as https from "https"
import * as http from "http"
import * as URL from "url"
// module.exports.my_https = my_https;

export function my_https(url:string, cookie:string){return new Promise<{data:Buffer,headers:http.IncomingHttpHeaders }>((resolve,rejects)=>{
    const _url = URL.parse(url)
    const options  = {
        headers:{
            cookie:cookie,
            'User-Agent':'mybot',
            'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8'

        },
        hostname:_url.hostname,
        path:_url.path,
        port:443,
    }
    https.get(options, (res:http.IncomingMessage) => {
        // console.log(typeof res, res.constructor.name)
        console.log(`[my_https]`,res.statusCode,url, res.headers['content-type'])

        if (parseInt(`${res.statusCode as number /100}`) != 2 && res.statusCode!=404) rejects({msg:`[CodeError] ${res.statusCode}`,headers:res.headers, statusCode:res.statusCode})//rejects(`[CodeError] ${res.statusCode} ${res.statusCode==303?res.headers?.location+' '+url:''}`)
        // if(err) console.log('resolve err', err);
        const data:Buffer[]=[];
        res.on('error', () => {rejects(undefined) });
        res.on('data', (chunk:Buffer) => { 
            data.push(chunk) });
        res.on('end', () => { resolve( {data:Buffer.concat(data),headers:res.headers}) });
    });

    
})}