export interface IProject {
    name: string;
    tags: string[];
    text:string;
    imgSrc:string;
    demoLink?:string;
    repoLink?:string;
}
export const projects:IProject[] = [{
    name:"myExams2",
    tags:  ["React", "TypeScript", "AWS"],
    text: "A tool to look up and export exam schedules. Used by 100+ students.",
    imgSrc:"https://user-images.githubusercontent.com/8275280/154332914-d2ef1e95-2dc5-4ecd-9600-d7f5f7015214.jpg",
    demoLink:"https://myexams2.vercel.app/",
    repoLink:"https://github.com/jiahao-c/myexams2"
},
{
    name:"Easy Syntax Tree",
    tags:  ["React", "TypeScript", "d3.js"],
    text:"A web app for creating linguistic syntax tree. Features interactive what-you-see-is-what-you-get editor.",
    imgSrc:"https://user-images.githubusercontent.com/8275280/99976795-d71e2a00-2dde-11eb-9d27-16d2b0be0d76.png",
    demoLink:"https://easysyntaxtree.web.app/",
    repoLink:"https://github.com/jiahao-c/easysyntaxtree-v2",
},
{
    name:"Find a place",
    tags:  ["Nodejs", "Firebase"],
    text: "A Telegram Bot and a serverless function to notify course registration availability",
    imgSrc:"https://user-images.githubusercontent.com/8275280/163461207-151da844-ecf5-48d8-a28a-5b315145bc9d.png",
    repoLink:"https://github.com/jiahao-c/let-me-in"
},
{
    name:"LRS+",
    tags: ["jQuery", "Bootstrap"],
    text:"A better McGill Lecture Recording System (LRS) catalog. ",
    imgSrc: "https://camo.githubusercontent.com/e817764b25d1bf329b8b5f64d53e20bfd6fbe95d/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f6a68636363632f4c5253506c7573406d61737465722f696d672f636f6d706172652e706e67",
    demoLink:"https://jiahao-c.github.io/LRSPlus/",
    repoLink:"https://github.com/jiahao-c/LRSPlus"
},
{
    name:"Courses to Linkedin",
    tags: ["Node.js"],
    text:"Automatically export courses from McGill Transcript to Linkedin",
    imgSrc: "https://camo.githubusercontent.com/fa55a413471a19dd445ca66859a100124c889c21/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f6a68636363632f436f7572736573546f4c696e6b6564696e406d61737465722f696d672f64656d6f2e676966",
    repoLink:"https://github.com/jiahao-c/CoursesToLinkedin"
},
{
    name:"Vowel Game",
    tags: ["Django","websocket"],
    text:"A better McGill Lecture Recording System (LRS) catalog. ",
    imgSrc: "https://user-images.githubusercontent.com/8275280/91280026-cd256480-e7b8-11ea-8e4b-e330284fb3a0.png",
    repoLink:"https://github.com/jiahao-c/TheVowelGame"
},
{
    name:"File System Design",
    tags:["Operating System","C"],
    text:"A design of a file system for an HDD",
    imgSrc:"https://user-images.githubusercontent.com/8275280/101381949-5a1ca580-38f2-11eb-8c4f-634bfd1c1891.png",
    repoLink:"https://github.com/jiahao-c/image-host/files/8101272/File_System_Design_Dec_8th.pdf"
},
{
    name:"Translation of Airbnb React Style Guide",
    tags:["Technical Writing"],
    text:"A zh_cn translation of Airbnb React Style Guide",
    imgSrc:"https://user-images.githubusercontent.com/8275280/154782502-5ff0b3a1-e5aa-4515-80a3-d04b28151878.png",
    repoLink:"https://github.com/jiahao-c/javascript/tree/master/react"
},
{
    name:"Find a lecture",
    tags:["BootStrap","jQuery"],
    text:"A tool to find McGill lecture schedules by room",
    demoLink:"https://jiahao-c.github.io/FindACourse/",
    imgSrc:"https://camo.githubusercontent.com/406e607811bbb4647e95e999d9cb29f5fc5c804a286db394e47555357332d539/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f6a68636363632f46696e6441436f75727365406d61737465722f696d672f63686f6f73654275696c64696e672e706e67",
    repoLink:"https://github.com/jiahao-c/FindACourse"
}
]
