/*! Copyright 2025 Adobe
All Rights Reserved. */
import{Initializer as n}from"@dropins/tools/lib.js";import{FetchGraphQL as i}from"@dropins/tools/fetch-graphql.js";const e=new n({init:async t=>{const o={};e.config.setConfig({...o,...t})},listeners:()=>[]}),s=e.config,{setEndpoint:a,setFetchGraphQlHeader:h,removeFetchGraphQlHeader:f,setFetchGraphQlHeaders:g,fetchGraphQl:l,getConfig:p}=new i().getMethods(),d=()=>"Howdy!",m=()=>"Howdy!";export{s as config,l as fetchGraphQl,p as getConfig,e as initialize,d as login,m as logout,f as removeFetchGraphQlHeader,a as setEndpoint,h as setFetchGraphQlHeader,g as setFetchGraphQlHeaders};
//# sourceMappingURL=api.js.map
