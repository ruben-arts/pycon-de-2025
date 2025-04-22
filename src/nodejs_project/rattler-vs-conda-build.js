import fetch from 'node-fetch';
import { execSync } from 'child_process';

import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs';

const COMMITS = {
  vale: {
    v0: '4f829d3ccb335d75abc825543dbf068bda938916',
    v1: '8a4fd98e738fcc3376b9ea316319c220a515e4b8',
  },
  dagster: {
    v0: '76c76e86bc306ff05ca1fa650a188450bd4da605',
    v1: '2d18ce2ed3863d7782bd7f561f6175658d505f6e',
  },
  pixi: {
    v0: '882459eaef473b4d42014700350a465ce831d377', // v0.40.1
    v1: 'a3e0f6077382e9540a3f25707b60b658006ddd2f', // v0.40.1 but with v1
  },
  rich: {
    v0: 'ac49d7062a7c0c7f4b3b7f00b36b869fe381c5e6', // v13.9.4
    v1: 'f9b6ead9d2e82c854f4fee4a5cd47d66db39dbc2', // v14.0.0 but with v1
  },
  suitesparse: {
    v0: '0498432e5b0d19de340332005802fb6ff666b9ab',
    v1: 'a7699fa70429ac60fb0fb243fa8db18a284917fe',
  },
  "rattler-build": {
    v0: '9c866f74b7e4264364ee0f54ec601ddb0d2e2e23',
    v1: '2aecf8fb4326bbd83aaad51a60204ad4c5f00fd1',
  },
};

const RE_DURATION = /^Successful in (.*)m$/;

async function getGitHubToken() {
  try {
    return execSync('gh auth token', { encoding: 'utf-8' }).trim();
  } catch (err) {
    console.error('Error: make sure you are logged in with `gh auth login`.');
    process.exit(1);
  }
}

async function maxDuration(pkg, commit, token) {
  const url = `https://github.com/conda-forge/${pkg}-feedstock/commit/${commit}/status-details`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const status = await res.json();
  const durations = [];

  for (const run of status.checkRuns) {
    const match = `${run.additionalContext}`.match(RE_DURATION);
    if (match) durations.push(parseFloat(match[1]));
  }

  return Math.max(...durations);
}

async function ciDelta([pkg, commits], token) {
  const v0 = await maxDuration(pkg, commits.v0, token);
  const v1 = await maxDuration(pkg, commits.v1, token);
  return {
    pkg,
    v0: `${v0} min`,
    v1: `${v1} min`,
    d: `${(v0 - v1).toFixed(2)} min`,
    remaining: `${((v1 / v0) * 100).toFixed(1)}%`,
    speedup: `${(v0 / v1).toFixed(2)}x`,
  };
}

async function renderChart(results) {
  const width = 1200;
  const height = width;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  results.sort((a, b) => Math.max(parseFloat(b.v0), parseFloat(b.v1)) - Math.max(parseFloat(a.v0), parseFloat(a.v1)));

  const labels = results.map(r => r.pkg);
  const v0Data = results.map(r => parseFloat(r.v0));
  const v1Data = results.map(r => parseFloat(r.v1));

  const font = 46;
  const configuration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'rattler-build',
          data: v1Data,
          backgroundColor: '#001E4DCC',
        },
        {
          label: 'conda-build',
          data: v0Data,
          backgroundColor: '#43B02A',
        },
      ],
    },
    options: {
      indexAxis: 'x',
      responsive: false,
      plugins: {
        title: {
          display: false,
          text: 'conda-forge build Duration Comparison (conda-build vs rattler-build)',
          font: {
            size: font,
          },
        },
        legend: {
          position: 'top',
          labels: {
            font: {
              size: font,
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            font: {
              size: font,
            },
          },
        },
        x: {
          title: {
            display: true,
            text: 'Minutes',
            font: {
              size: font,
            },
          },
          ticks: {
            font: {
              size: font,
            },
          },
        },
      },
      datasets: {
        bar: {
          indexAxis: 'y',
          barPercentage: 0.8,
          grouped: false,
        },
      },
    }
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync('ci-durations.png', image);
}

function printCumulative(results) {
  const totalV0 = results.reduce((sum, r) => sum + parseFloat(r.v0), 0);
  const totalV1 = results.reduce((sum, r) => sum + parseFloat(r.v1), 0);

  const delta = totalV0 - totalV1;
  const speedup = totalV0 / totalV1;

  console.log('\nCumulative Summary:');
  console.log(`  conda-build:     ${totalV0.toFixed(2)} min`);
  console.log(`  rattler-build:   ${totalV1.toFixed(2)} min`);
  console.log(`  Saved:           ${delta.toFixed(2)} min`);
  console.log(`  Speedup:         ${speedup.toFixed(2)}x`);
  console.log(`  Total Packages:  ${results.length}`);
}

(async () => {
  const token = await getGitHubToken();
  const results = await Promise.all(
    Object.entries(COMMITS).map((entry) => ciDelta(entry, token))
  );
  console.table(results);
  printCumulative(results);
  await renderChart(results);
})();
