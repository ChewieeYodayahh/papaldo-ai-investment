import { Composition, Folder } from "remotion";

import { PapaldoPromo } from "./PapaldoPromo";
import { Brand } from "./scenes/Brand";
import { Cta } from "./scenes/Cta";
import { Hook } from "./scenes/Hook";
import { Learn } from "./scenes/Learn";
import { Markets } from "./scenes/Markets";
import { Problem } from "./scenes/Problem";
import { Quiz } from "./scenes/Quiz";
import { Tools } from "./scenes/Tools";
import { Trade } from "./scenes/Trade";
import { RealTest } from "./scenes/RealTest";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="PapaldoPromo" component={PapaldoPromo} durationInFrames={1215} fps={30} width={1920} height={1080} />
      <Composition id="RealTest" component={RealTest} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Folder name="PapaldoPromo-Scenes">
        <Composition id="Hook" component={Hook} durationInFrames={120} fps={30} width={1920} height={1080} />
        <Composition id="Problem" component={Problem} durationInFrames={120} fps={30} width={1920} height={1080} />
        <Composition id="Brand" component={Brand} durationInFrames={105} fps={30} width={1920} height={1080} />
        <Composition id="Quiz" component={Quiz} durationInFrames={165} fps={30} width={1920} height={1080} />
        <Composition id="Trade" component={Trade} durationInFrames={180} fps={30} width={1920} height={1080} />
        <Composition id="Markets" component={Markets} durationInFrames={135} fps={30} width={1920} height={1080} />
        <Composition id="Tools" component={Tools} durationInFrames={225} fps={30} width={1920} height={1080} />
        <Composition id="Learn" component={Learn} durationInFrames={135} fps={30} width={1920} height={1080} />
        <Composition id="CTA" component={Cta} durationInFrames={150} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
};
