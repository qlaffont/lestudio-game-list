import '../../assets/index.scss';
import 'virtual:windi.css';
import {Input} from './atoms/Input';
import {useEffect, useState} from 'react';
import {SelectComponent} from './atoms/Select/Select';
import {Button} from './atoms/Button';
import {useDebounce, useInterval} from 'usehooks-ts';
import {getProcessesList, getSavedList, getToken, saveToken, setSavedList} from '#preload';

const App = () => {
  const [tokenInput, setTokenInput] = useState<string>();
  const [process, setProcess] = useState<string>();
  const tokenDebounced = useDebounce(tokenInput, 300);
  const [tokenIsDisplayed, setTokenIsDisplayed] = useState<boolean>();

  const [processes, setProcesses] = useState<
    {
      processName: string;
      windowTitle: string;
    }[]
  >([]);
  const [, setList] = useState<
    {
      processName: string;
      windowTitle: string;
      igdbId: string;
    }[]
  >([]);

  useEffect(() => {
    //Init app
    setTokenInput(getToken());

    setSavedList(getSavedList());

    //Fetch indexed games
    (async () => {
      let res = await fetch(
        `https://raw.githubusercontent.com/qlaffont/igdb-game-process-list/main/${'win32'}.json`,
      );

      res = await res.json();

      setList(
        res as unknown as {
          processName: string;
          windowTitle: string;
          igdbId: string;
        }[],
      );

      setSavedList(
        res as unknown as {
          processName: string;
          windowTitle: string;
          igdbId: string;
        }[],
      );
    })();
  }, []);

  useEffect(() => {
    if (tokenDebounced) {
      saveToken(tokenDebounced + '');
    }
  }, [tokenDebounced]);

  useInterval(() => {
    (async () => setProcesses(await getProcessesList()))();
  }, 3000);

  return (
    <div className="p-5 space-y-5">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <div>
          <img
            src="/assets/logo.svg"
            className="text-white w-64"
          />
        </div>
        <div>Game List</div>
      </h1>

      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex justify-center">
            <img
              src="https://images.igdb.com/igdb/image/upload/t_cover_big/co4lkq.png"
              className="max-h-40"
            />
          </div>
          <div>
            <p className="line-clamp-1 font-bold text-2xl">Mwizz</p>
            <p className="italic line-clamp-1 ">Mwizz.exe</p>
            <a
              className="line-clamp-1 underline text-blue-500 hover:opacity-80"
              href="https://www.igdb.com/games/mwizz"
              target="_blank"
            >
              https://www.igdb.com/games/mwizz
            </a>
          </div>
        </div>

        <div className="border" />

        <div>
          <Input
            label="User Token"
            value={tokenInput}
            type={tokenIsDisplayed ? 'text' : 'password'}
            suffixIcon={tokenIsDisplayed ? 'icon icon-eye-full' : 'icon icon-eye'}
            onClick={() => setTokenIsDisplayed(v => !v)}
            onChange={evt => setTokenInput(evt?.target?.value)}
          />
        </div>

        <div className="border" />

        <div className="space-y-3">
          <h2 className="font-xl font-bold">Add game to list</h2>

          <SelectComponent
            label="Processes"
            value={process}
            onChange={evt => setProcess(evt?.value)}
            options={processes.map(({processName, windowTitle}) => ({
              label: `${processName} (${windowTitle})`,
              value: processName,
            }))}
            isClearable
            disabled={tokenInput?.length === 0}
          />

          <SelectComponent
            label="IGDB Game"
            value={undefined}
            onChange={undefined}
            options={[]}
            disabled={tokenInput?.length === 0}
          />

          <Button className="mx-auto">Submit</Button>
        </div>
      </div>
    </div>
  );
};

export default App;
