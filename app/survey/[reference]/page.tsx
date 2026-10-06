import { MobileMoveSurvey } from "@/components/moving/mobile-move-survey";
export const dynamic="force-dynamic";
export default async function SurveyPage({params}:{params:Promise<{reference:string}>}){const {reference}=await params;return <MobileMoveSurvey reference={reference.slice(0,85)}/>}
