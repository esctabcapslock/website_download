// import * as Https from "https"
import {writeFileSync, existsSync, mkdirSync, appendFileSync, readFileSync} from "fs"
import {my_https} from './module/my_https'
import {update_cookies} from './module/update_cookies'
import * as URL from "url"

console.log('my_https',my_https);

const list_303:string[] = []

 
function httpurl2https(u:string|undefined){
    if(!u) return u
    if(u.startsWith('http:')) u = u.replace(/^http:/,'https:')
    return u
}

const {host,ignore, startpath} = JSON.parse(readFileSync('setting.json').toString()) as {host:string, ignore:string[], startpath:string}
console.log(host,ignore)
let cookie = '';

(async ()=>{
    const url = 'https://'+host
    const visit_queue = [startpath];
    const visited_queue:string[] = [];

    // const  int_a = setInterval(async ()=>{
    //     if (!visit_queue.length) {setTimeout(() => {
    //         if (!visit_queue.length) clearInterval(int_a)
    //     }, 2000);; return;}
    while (visit_queue.length){

        let sub_url = visit_queue.splice(0,1)[0].replace(/^\//,'')
        console.log('[while]', `[sub_url]: "${sub_url}"`,'방문예정:', visit_queue.length, '방문:',visited_queue.length)

        // console.log(2345);

        // 로그 저장
        writeFileSync('visitqueue.log',visit_queue.map(v=>v).join('\n'))
        writeFileSync('visited_queue.log',visited_queue.map(v=>v).sort().join('\n'))

        try{

         // console.log(data.toString());
        let savepath = './web/'+host+'/'+(sub_url?sub_url:'')
        if (savepath.endsWith('/')) savepath+='index'
        savepath=savepath.replace(/\?/gi,'？')
        create_path(savepath)
        console.log('[savepath:]',savepath)

        let mime:undefined|string = undefined
        const {data,headers} = await my_https(url+'/'+sub_url, cookie)// as {data:Buffer, headers:any}
        if(headers['content-type']){
            mime =  headers['content-type'].split(';')[0].split('/')[1]
            console.log('[mime]',mime)
            if (mime=='javascript') savepath+='.js'
            else if(mime && mime.length<5) savepath+='.'+mime
        }

        if (mime=='html'||mime=='javascript'||mime=='css') {
            const {urls,reduced} = mydataparse(data.toString())
            writeFileSync(savepath,reduced)
            visited_queue.push(sub_url)
            for (const u of urls) if(!visit_queue.includes(u) && !visited_queue.includes(u) && !ignore.some(v=>RegExp(v).test(u))) visit_queue.push(u)
        }else{
            writeFileSync(savepath,data)
        }

        
        }catch(err:any|string){
            
            appendFileSync('./err.log',`[time]:${(new Date()).toTimeString()} [req]:${url+'/'+sub_url}, [err]:${JSON.stringify(err)}\n`)
            

            if(err && err?.headers && err.statusCode==303 && err.headers.location){
                if(err.headers.location.includes(host)){
                    const new_url = URL.parse(err.headers.location).path
                    console.log('[new_url]',new_url)

                    if(new_url == '/login/index.php') {
                        cookie = (await update_cookies()) //as string
                        visit_queue.push(sub_url)
                    }
                    else if (typeof new_url == 'string'){
                        visited_queue.push(sub_url)
                        visit_queue.push(new_url)
                        list_303.push(sub_url+'\t'+new_url)
                        writeFileSync('./web/'+host+'/list_303.log',list_303.join('\n')) //리다이렉트 목록
                    }
                }
            }
            else {
                console.error(err)
                console.log('!!!!!!1err real!!!!!')
                cookie = (await update_cookies()) //as string
                visited_queue.push(sub_url)
                // visit_queue.push(sub_url)
            }
            
    }
}//,1000/10)
    
})();


function mydataparse(data:string){
    // console.log('[mydataparse]', typeof data, data)

    const url_out = data.match(/href=\"(.*?)\"/gi)?.filter(v=>v.includes('://'+host)).map(v=>v.replace(/^href="/,'').replace(/"$/,'').replace(RegExp("http(s*)://"+host),'').replace(/^\//,'').replace(/#(.*)$/,'').replace(/&amp;/gi,'&'))
    const url_out2 = data.match(/src=\"(.*?)\"/gi)?.filter(v=>v.includes('://'+host)).map(v=>v.replace(/^src="/,'').replace(/"$/,'').replace(RegExp("http(s*)://"+host),'').replace(/^\//,'').replace(/#(.*)$/,'').replace(/&amp;/gi,'&'))
    // css를 위한 것
    const url_out3 = data.match(/url\(\"(.*?)\"\)/gi)?.filter(v=>v.includes('://'+host)).map(v=>v.replace(/^url\("/,'').replace(/"$/,'').replace(RegExp("http(s*)://"+host),'').replace(/^\//,'').replace(/#(.*)$/,'').replace(/&amp;/gi,'&'))
    const url_out4 = data.match(/url\(\'(.*?)\'\)/gi)?.filter(v=>v.includes('://'+host)).map(v=>v.replace(/^url\('/,'').replace(/'$/,'').replace(RegExp("http(s*)://"+host),'').replace(/^\//,'').replace(/#(.*)$/,'').replace(/&amp;/gi,'&'))
    // console.log('url_out',url_out, url_out2)
    if(url_out2) for(let i of url_out2) url_out?.push(i)
    const urls:string[] = []
    if(url_out) for (const u of url_out) if (!urls.includes(u)) urls.push(u)
    urls.sort()
    // console.log('urls',urls)
    

    const reduced = data.replace(RegExp(host,'gi'),'localhost/'+host)
    return {urls,reduced}
}

function create_path(path:string){
    // console.log('[create_path]',path)
    if(path.startsWith('./')) path = path.replace(/^(\.\/)/,'')
    if(path.startsWith('/')) path = path.replace(/^(\/)/,'')
    
    
    const path_uul = path.split('/')
    path_uul.pop()
    // console.log(path_uul)
    let d = './'
    for (const u of path_uul){
        // console.log('[create_path] -> d,u:',d,u)
        d+=u+'/'
        if(!existsSync(d)) mkdirSync(d)
    }
}

