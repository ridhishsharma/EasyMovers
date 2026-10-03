import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { FinanceReportError, getMonthlyCollections } from "@/lib/finance-monthly-collections";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});

export async function GET(request:Request){
  const access=await authorizeCrmPermission(request,CRM_PERMISSIONS.PAYMENT_READ);
  if(!access.authorized)return reply({success:false,error:{code:access.code,message:access.message}},access.status);
  try{
    const params=new URL(request.url).searchParams;
    const data=await getMonthlyCollections({month:params.get("month"),segment:params.get("segment")});
    return reply({success:true,data});
  }catch(error){
    if(error instanceof FinanceReportError)return reply({success:false,error:{code:error.code,message:error.message}},error.status);
    const reference=crypto.randomUUID();console.error(`[FINANCE_COLLECTION_REPORT_FAILED:${reference}]`,error);
    return reply({success:false,error:{code:"FINANCE_COLLECTION_REPORT_FAILED",message:`Unable to load monthly collections. Reference: ${reference}`}},503);
  }
}
