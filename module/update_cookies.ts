import * as https from "https"
import * as http from "http"
//import * as URL from "url"
import {readFileSync} from "fs"

const user_agent = readFileSync('./user_agent.txt').toString();
 
function httpurl2https(u:string|undefined){
    if(!u) return u
    if(u.startsWith('http:')) u = u.replace(/^http:/,'https:')
    return u
}

function parse_cookies(ar:string[]|undefined){
    // console.log('pc',ar)
    if(!ar) return {}

    const out:{[key:string]:string} = {}
    for(const d of ar){
        const dd = d.split(';')[0]
        const ddd = dd.split('=')
        out[ddd.splice(0,1)[0]] = decodeURI(ddd.join('='))
        // console.log('for',d,dd,ddd);
    }
    return out
}

function parsepost(obj:{[key:string]:string}){
    const out:String[] = []
    for(let i  in obj){
        // encodeURIComponent 안하고 그냥 했다가.. 1시간 날림 ;;;;
        out.push(i+'='+encodeURIComponent(obj[i])) //이부분을 '=' 다음에 안 더해서 한참 오류남
    }
    return out.join('&')
}

function parsecookie(obj:{[key:string]:string}){
    const out:String[] = []
    for(let i in obj){
        out.push(i+'='+encodeURI(obj[i])) //이부분을 '=' 다음에 안 더해서 한참 오류남
    }
    // console.log('[parsecookie]',out.join('; '))
    return out.join('; ')
}

function https_cookies(method:string, url:string, cookies:{[key:string]:string}|undefined, postdata:{[key:string]:string}|undefined, Referer:string|undefined){
    return new Promise<{statusCode:number, data:string, cookie:{[key:string]:string}, headers:http.IncomingHttpHeaders}>((resolve,rejects)=>{
    //const _url = URL.parse(url)
    //const rl = Referer?URL.parse(Referer):''
    const options:{[key:string]:number|string|{[key:string]:string|number};headers:{[key:string]:string|number}}  = {
        headers:{
            'User-Agent':user_agent,
            'Cookie':cookies?parsecookie(cookies):'',
            // Referer,
            // Host:_url.hostname,
            // Origin:rl?rl.protocol+'//'+rl.host:_url.protocol+'//'+_url.host,
            'Content-Type': "application/x-www-form-urlencoded",
        },
        method,
        // hostname:_url.hostname,
        // path:_url.path,
        port:443,
    }

    if (method=='POST'){
        if(postdata) options.headers["Content-Length"] = parsepost(postdata).length
    }
    const req = https.request(url,options, (res:http.IncomingMessage) => {
        let data = ''
        
        res.setEncoding('utf8');
        res.on('error', (e) => {console.log(e); rejects(e) });
        res.on('data', (chunk:string) => { data+=chunk });
        res.on('end', () => {
            resolve({statusCode:res.statusCode as number,data,cookie:parse_cookies(res.headers['set-cookie']), headers:res.headers})
        });
    })
    if(method=='POST' && postdata) req.write(parsepost(postdata))
    req.end()
})}

export function update_cookies(){return new Promise<string>(async (resolve,rejects)=>{
    
    `
    [code]
    `

    let url = httpurl2https(headers.location)
    let code = statusCode

    while (url && code!=200){
        // console.log('purl',url)
        var {statusCode,data,cookie, headers} = (await https_cookies('GET',url, cookies, undefined, refurl))
        cookies = {...cookies, ...cookie} 
        // console.log('htmldata',data.trim().length)
        refurl = url
        url = httpurl2https(headers.location)
        code = statusCode
    }

    resolve(parsecookie(cookies))

})}