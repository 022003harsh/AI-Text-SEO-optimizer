// Rename the imported Home to something else (like HomePage)
import HomePage from "@/page/Home/page";

export default function HomeWrapper() {
  return (
    <div className="">
      <HomePage />
    </div>
  );
}
