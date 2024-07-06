import { InfoButton } from "components/info-dialog";
import DeckSelector from "./deck-selector";
import SpreadSelector from "./spread-selector";
import { Checkbox } from "components/ui/checkbox";
import { useState } from "react";
import CardInput from "./card-input";

function TarotOptions() {
  const [showCardInput, setShowCardInput] = useState();
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center space-y-8 md:flex-col md:space-x-16">
        <DeckSelector />
        <div className="flex">
          <SpreadSelector />
          <InfoButton type="spread" />
        </div>
      </div>
      <div className="flex items-center justify-center space-x-2 pt-8">
        <Checkbox id="terms1" checked={showCardInput} onCheckedChange={setShowCardInput as () => void} />
        <div className="grid leading-none">
          <label
            htmlFor="terms1"
            className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have a physical deck
            <InfoButton type="physical" />
          </label>
        </div>
      </div>
      {showCardInput && <CardInput />}
    </div>
  );
}

export default TarotOptions;
