import { equal, deepEqual } from 'assert-helpers'
import kava from 'kava'
import { tmpdir } from 'os'
import { join } from 'path'
import {
	isPresent,
	isReadable,
	isWritable,
	readFile,
	writeFile,
	deleteFile,
	deleteEntireDirectory,
	readEntireDirectory,
	mkdirp,
	readdir,
	readDirectory,
} from './index.js'

kava.suite('@bevry/file', function (suite, test) {
	test('works as expected', function (done) {
		Promise.resolve()
			.then(async function () {
				const root = join(tmpdir(), `bevry-file-${Math.random()}`)
				const dir = join(root, 'nested', 'directory')
				await mkdirp(dir)
				const file = join(dir, 'file.txt')
				await deleteFile(file) // test delete success on non-existent file
				const data = String(Math.random())
				equal(
					await isPresent(file),
					false,
					'is not present when it is not present'
				)
				equal(
					await isReadable(file),
					false,
					'is not readable when it is not present'
				)
				equal(
					await isWritable(file),
					false,
					'is not writable when it is not present'
				)
				await writeFile(file, data)
				equal(await isPresent(file), true, 'is present when it is present')
				equal(await isReadable(file), true, 'is readable when it is present')
				equal(await readFile(file), data, 'has the data we expected')
				equal(await isWritable(file), true, 'is writable when it is present')
				deepEqual(
					await readdir(dir),
					['file.txt'],
					'directory with file was read'
				)
				deepEqual(
					await readEntireDirectory(root),
					[
						'nested',
						join('nested', 'directory'),
						join('nested', 'directory', 'file.txt'),
					],
					'entire directory with file was read'
				)
				await deleteFile(file)
				equal(await isPresent(file), false, 'is not present when deleted')
				equal(await isReadable(file), false, 'is not readable when deleted')
				equal(await isWritable(file), false, 'is not writable when deleted')
				deepEqual(
					await readDirectory(dir),
					[],
					'directory with missing file was read'
				)
				deepEqual(
					await readEntireDirectory(root),
					['nested', join('nested', 'directory')],
					'entire directory was read'
				)
				await deleteEntireDirectory(root)
				equal(
					await isPresent(dir),
					false,
					'is not present when it is not present'
				)
				equal(
					await isPresent(root),
					false,
					'is not present when it is not present'
				)
			})
			.then(() => done())
			.catch((err) => done(err))
		// finally breaks early node support
	})
})
