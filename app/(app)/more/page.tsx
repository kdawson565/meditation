import { redirect } from "next/navigation";
// "More" became "You". Old links and installed shortcuts land in the right place.
export default function More() {
  redirect("/you");
}
