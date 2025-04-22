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
  const width = 400;
  const height = 400;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  results.sort((a, b) => Math.max(parseFloat(b.v0), parseFloat(b.v1)) - Math.max(parseFloat(a.v0), parseFloat(a.v1)));

  const labels = results.map(r => r.pkg);
  const v0Data = results.map(r => parseFloat(r.v0));
  const v1Data = results.map(r => parseFloat(r.v1));

  const configuration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'rattler-build',
          data: v1Data,
          backgroundColor: 'rgba(255, 99, 132, 1)',
        },
        {
          label: 'conda-build',
          data: v0Data,
          backgroundColor: 'rgba(54, 162, 235, 1)',
        },
      ],
    },
    options: {
      indexAxis: 'x',
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'conda-forge build Duration Comparison (conda-build vs rattler-build)',
        },
        legend: {
          position: 'top',
        },
      },
      scales: {
        x: {
          stacked: false,
          ticks: { font: { size: 14 } },
        },
        y: {
          title: {
            display: true,
            text: 'Minutes',
          },
        },
      },
      datasets: {
        bar: {
          barThickness: 60,
          grouped: false,
        },
      },
    },
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync('ci-durations.png', image);
}

(async () => {
  const token = await getGitHubToken();
  const results = await Promise.all(
    Object.entries(COMMITS).map((entry) => ciDelta(entry, token))
  );
  console.table(results);
  await renderChart(results);
})();
