using Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.Logging;
using Npgsql.Bulk;
using Repositories.Interfaces;
using Repositories.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;


namespace Repositories.Implements
{
    public class DBRepository : IDBRepository
    {
        public WebTicketDbContext Context { get; }
        public DBRepository(WebTicketDbContext context)
        {
            Context = context;
        }

        #region Create

        public virtual async Task<T> AddAsync<T>(T entity, bool saveChange = false, bool needAuditor = true)
            where T : class
        {
            var entry = await Context.Set<T>().AddAsync(entity);
            if (saveChange)
            {
                await SaveChangesAsync();
            }

            //if (needAuditor)
            //{
            //    await WriteAuditLogAsync(entry.Entity, AuditActionType.Create);
            //}

            return entry.Entity;
        }

        public virtual async Task<int> AddRangeAsync<T>(IEnumerable<T> entities, bool saveChange = false)
            where T : class
        {
            await Context.Set<T>().AddRangeAsync(entities);
            var result = saveChange ? await SaveChangesAsync() : entities.Count();
            //await WriteAuditLogAsync(entities.ToList(), AuditActionType.Create);
            return result;
        }

        public async Task BulkAddAsync<T>(IEnumerable<T> source) where T : class
        {
            await Context.Set<T>().AddRangeAsync(source);
            //await WriteAuditLogAsync(source.ToList(), AuditActionType.Create);
        }

        #endregion

        #region Retrieve

        public virtual T Get<T>(Expression<Func<T, bool>> predicate, bool tracking = false) where T : class
        {
            return tracking
                ? Context.Set<T>().FirstOrDefault(predicate)
                : Context.Set<T>().AsNoTracking().FirstOrDefault(predicate);
        }

        public virtual IQueryable<T> FilterPureAsync<T>(Expression<Func<T, bool>> predicate,
            List<string> navProps = null) where T : class
        {
            return GetDbSetIncludeNavigationProperties<T>(navProps).Where(predicate);
        }

        public async virtual Task<T> GetPureAsync<T>(Expression<Func<T, bool>> predicate, List<string> navProps = null)
            where T : class
        {
            return await GetDbSetIncludeNavigationProperties<T>(navProps).Where(predicate).FirstOrDefaultAsync();
        }

        /// <summary>
        /// Retrieve DbSet with navigation properties
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <returns></returns>
        private IQueryable<T> GetDbSetIncludeNavigationProperties<T>(List<string> navProps = null) where T : class
        {
            var query = Context.Set<T>().AsNoTracking().AsQueryable();
            if (navProps == null || navProps.Count == 0) return query;

            foreach (var navProp in navProps)
            {
                query = query.Include(navProp);
            }

            return query;
        }

        public virtual async Task<T> GetAsync<T>(Expression<Func<T, bool>> predicate, bool tracking = false)
            where T : class
        {
            return tracking
                ? await EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(Context.Set<T>(), predicate)
                : await EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(Context.Set<T>().AsNoTracking(),
                    predicate);
        }

        public virtual IQueryable<T> GetAllWithNoTrackingAsync<T>(Expression<Func<T, bool>> predicate = null)
            where T : class
        {
            var entities = predicate == null
                ? Context.Set<T>().AsNoTracking()
                : Context.Set<T>().AsNoTracking().Where(predicate);
            return entities;
        }

        public virtual IQueryable<T> GetAllWithTrackingAsync<T>(Expression<Func<T, bool>> predicate = null)
            where T : class
        {
            var entities = predicate == null
                ? Context.Set<T>()
                : Context.Set<T>().Where(predicate);
            return entities;
        }


        public async Task<TResult> GetWithSelectorAsync<T, TResult>(Expression<Func<T, bool>> predicate,
            Expression<Func<T, TResult>> selector) where T : class
        {
            return await Context.Set<T>().Where(predicate).Select(selector).FirstOrDefaultAsync();
        }

        public IQueryable<TResult> GetAllWithSelectorQueryable<T, TResult>(Expression<Func<T, bool>> predicate,
            Expression<Func<T, TResult>> selector) where T : class
        {
            return Context.Set<T>().AsNoTracking().Where(predicate).Select(selector);
        }

        public async Task<List<TResult>> GetAllWithSelectorAsync<T, TResult>(Expression<Func<T, bool>> predicate,
            Expression<Func<T, TResult>> selector) where T : class
        {
            return await Context.Set<T>().Where(predicate).Select(selector).ToListAsync();
        }

        public async Task<List<T>> GetAllWithAsync<T>(Expression<Func<T, bool>> predicate) where T : class
        {
            return await Context.Set<T>().Where(predicate).ToListAsync();
        }

        public virtual async Task<TableInfo<T>> GetAllWithPagingAsync<T, TResult>(
            TableQueryParameter<T, TResult> queryParameter) where T : class
        {
            TableInfo<T> resut = new TableInfo<T>();
            var dbSet = this.Context.Set<T>().AsQueryable();
            if (!queryParameter.IncludedPropertyList.IsNullOrEmpty())
            {
                foreach (var item in queryParameter.IncludedPropertyList)
                {
                    dbSet = dbSet.Include<T>(item);
                }
            }
            int skipCount = (queryParameter.Pager.Index - 1) * queryParameter.Pager.Size;
            IOrderedQueryable<T> allDatas;
            if (queryParameter.Sorter.IsAscending)
            {
                allDatas = queryParameter.Filter != null
                    ? dbSet.Where<T>(queryParameter.Filter).OrderBy(queryParameter.Sorter.SortBy)
                    : dbSet.OrderBy(queryParameter.Sorter.SortBy);
                if (queryParameter.Sorter.ThenSortBy != null)
                {
                    allDatas = allDatas.ThenBy(queryParameter.Sorter.ThenSortBy);
                }
            }
            else
            {
                allDatas = queryParameter.Filter != null
                    ? dbSet.Where<T>(queryParameter.Filter).OrderByDescending(queryParameter.Sorter.SortBy)
                    : dbSet.OrderByDescending(queryParameter.Sorter.SortBy);
                if (queryParameter.Sorter.ThenSortBy != null)
                {
                    allDatas = allDatas.ThenByDescending(queryParameter.Sorter.ThenSortBy);
                }
            }

            var allCount = resut.TotalItemsCount = await allDatas.CountAsync();
            resut.PageCount = allCount == 0
                ? 1
                : (allCount % queryParameter.Pager.Size == 0
                    ? (allCount / queryParameter.Pager.Size)
                    : (allCount / queryParameter.Pager.Size) + 1);
            resut.Items =
                await (skipCount == 0
                    ? allDatas.Take(queryParameter.Pager.Size)
                    : allDatas.Skip(skipCount).Take(queryParameter.Pager.Size)).ToListAsync();
            return resut;
        }

        public virtual async Task<TableInfo<T>> GetAllPureWithPagingAsync<T, TResult>(
            TableQueryParameter<T, TResult> queryParameter, List<string> props = null) where T : class
        {
            TableInfo<T> resut = new TableInfo<T>();
            var dbSet = GetDbSetIncludeNavigationProperties<T>(props);
            int skipCount = (queryParameter.Pager.Index - 1) * queryParameter.Pager.Size;
            IOrderedQueryable<T> allDatas;
            if (queryParameter.Sorter.IsAscending)
            {
                allDatas = queryParameter.Filter != null
                    ? dbSet.Where<T>(queryParameter.Filter).OrderBy(queryParameter.Sorter.SortBy)
                    : dbSet.OrderBy(queryParameter.Sorter.SortBy);
                if (queryParameter.Sorter.ThenSortBy != null)
                {
                    allDatas = allDatas.ThenBy(queryParameter.Sorter.ThenSortBy);
                }
            }
            else
            {
                allDatas = queryParameter.Filter != null
                    ? dbSet.Where<T>(queryParameter.Filter).OrderByDescending(queryParameter.Sorter.SortBy)
                    : dbSet.OrderByDescending(queryParameter.Sorter.SortBy);
                if (queryParameter.Sorter.ThenSortBy != null)
                {
                    allDatas = allDatas.ThenByDescending(queryParameter.Sorter.ThenSortBy);
                }
            }

            var allCount = resut.TotalItemsCount = await allDatas.CountAsync();
            resut.PageCount = allCount == 0
                ? 1
                : (allCount % queryParameter.Pager.Size == 0
                    ? (allCount / queryParameter.Pager.Size)
                    : (allCount / queryParameter.Pager.Size) + 1);
            resut.Items =
                await (skipCount == 0
                    ? allDatas.Take(queryParameter.Pager.Size)
                    : allDatas.Skip(skipCount).Take(queryParameter.Pager.Size)).ToListAsync();
            return resut;
        }

        public virtual async Task<TableInfo<T>> GetAllWithClientPagingAsync<T, TResult>(
            TableQueryParameter<T, TResult> queryParameter) where T : class
        {
            TableInfo<T> resut = new TableInfo<T>();
            var dbSet = this.Context.Set<T>();
            int skipCount = (queryParameter.Pager.Index - 1) * queryParameter.Pager.Size;

            var allDatas = queryParameter.Filter != null
                ? await dbSet.Where(queryParameter.Filter).ToListAsync()
                : await dbSet.ToListAsync();
            IOrderedEnumerable<T> datas;
            if (queryParameter.Sorter.IsAscending)
            {
                datas = allDatas.OrderBy(queryParameter.Sorter.SortBy.Compile());
                if (queryParameter.Sorter.ThenSortBy != null)
                {
                    datas = datas.ThenBy(queryParameter.Sorter.ThenSortBy.Compile());
                }
            }
            else
            {
                datas = allDatas.OrderByDescending(queryParameter.Sorter.SortBy.Compile());
                if (queryParameter.Sorter.ThenSortBy != null)
                {
                    datas = datas.ThenByDescending(queryParameter.Sorter.ThenSortBy.Compile());
                }
            }

            var allDataList = datas.ToList();
            var allCount = resut.TotalItemsCount = allDataList.Count;
            resut.PageCount = allCount == 0
                ? 1
                : (allCount % queryParameter.Pager.Size == 0
                    ? (allCount / queryParameter.Pager.Size)
                    : (allCount / queryParameter.Pager.Size) + 1);
            resut.Items = skipCount == 0
                ? allDataList.Take(queryParameter.Pager.Size).ToList()
                : allDataList.Skip(skipCount).Take(queryParameter.Pager.Size).ToList();
            return resut;
        }

        public virtual async Task<bool> AnyAsync<T>(Expression<Func<T, bool>> predicate) where T : class
        {
            return await Context.Set<T>().AsNoTracking().AnyAsync(predicate);
        }

        #endregion

        #region Update

        public virtual async Task<int> UpdateAsync<T>(T entity, bool saveChange = false, bool needAuditor = true)
            where T : class
        {
            Context.Set<T>().Update(entity);
            var result = await SaveChangesInternalAsync(saveChange, 1);
            //if (needAuditor)
            //{
            //    await WriteAuditLogAsync(entity, AuditActionType.Update);
            //}

            return result;
        }

        public virtual async Task<int> UpdateRangeAsync<T>(List<T> entities, int step, bool saveChange = false)
            where T : class
        {
            var list = new List<List<T>>();

            for (int i = 0; i < entities.Count; i += step)
            {
                list.Add(entities.GetRange(i, Math.Min(step, entities.Count - i)));
            }
            int totalCount = 0;
            foreach (var entitList in list)
            {
                totalCount += await UpdateRangeAsync(entitList, saveChange);
            }

            return totalCount;
        }

        public virtual async Task<int> UpdateRangeAsync<T>(IEnumerable<T> entities, bool saveChange = false)
            where T : class
        {
            foreach (T entity in entities)
            {
                Context.Set<T>().Update(entity);
            }

            int result = await SaveChangesInternalAsync(saveChange, entities.Count());
            //await WriteAuditLogAsync(entities.ToList(), AuditActionType.Update);
            return result;
        }

        public virtual async Task<int> UpdateRangeWithoutAuditAsync<T>(IEnumerable<T> entities, bool saveChange = false)
            where T : class
        {
            foreach (T entity in entities)
            {
                Context.Set<T>().Update(entity);
            }

            int result = await SaveChangesInternalAsync(saveChange, entities.Count());
            return result;
        }


        // public virtual async Task BatchUpdateAsync<T>(IEnumerable<T> items,
        //     Action<UpdateSpecification<T>> updateSpecification, bool needAuditor = true) where T : class
        // {
        //     if (updateSpecification != null)
        //     {
        //         BulkConfig config = new BulkConfig();
        //         config.PropertiesToIncludeOnCompare = new List<string>();
        //         config.PropertiesToIncludeOnUpdate = new List<string>();
        //         var spec = new UpdateSpecification<T>();
        //         updateSpecification(spec);
        //         var array = spec.Properties;
        //         if (array != null)
        //         {
        //             for (int i = 0; i < array.Length; i++)
        //             {
        //                 var oneProperty = array[i];
        //                 if (oneProperty != null)
        //                 {
        //                     if (oneProperty.NodeType == ExpressionType.Lambda)
        //                     {
        //                         if (oneProperty.Body != null)
        //                         {
        //                             if (oneProperty.Body.NodeType == ExpressionType.MemberAccess)
        //                             {
        //                                 var memberBody = oneProperty.Body as MemberExpression;
        //                                 if (memberBody != null)
        //                                 {
        //                                     var memberInfo = memberBody.Member;
        //                                     if (memberInfo != null)
        //                                     {
        //                                         config.PropertiesToIncludeOnCompare.Add(memberInfo.Name);
        //                                         config.PropertiesToIncludeOnUpdate.Add(memberInfo.Name);
        //                                     }
        //                                 }
        //                             }
        //                             else if (oneProperty.Body.NodeType == ExpressionType.Convert)
        //                             {
        //                                 var unaryBody = oneProperty.Body as UnaryExpression;
        //                                 if (unaryBody != null)
        //                                 {
        //                                     var operand = unaryBody.Operand as MemberExpression;
        //                                     if (operand != null)
        //                                     {
        //                                         var memberInfo = operand.Member;
        //                                         if (memberInfo != null)
        //                                         {
        //                                             config.PropertiesToIncludeOnCompare.Add(memberInfo.Name);
        //                                             config.PropertiesToIncludeOnUpdate.Add(memberInfo.Name);
        //                                         }
        //                                     }
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //
        //         await this.BatchUpdateAsync(items, config, needAuditor);
        //     }
        //     else
        //     {
        //         await this.BatchUpdateAsync(items, bulkConfig: null, needAuditor);
        //     }
        // }


        public async Task BulkUpdateAsync<T>(Expression<Func<T, bool>> whereCondition,
            Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>> setPropertyCalls) where T : class
        {
            await Context.Set<T>().Where(whereCondition)
                .ExecuteUpdateAsync(setPropertyCalls);
        }

        public async Task BulkUpdateAsync<T>(IEnumerable<T> source) where T : class
        {
            var uploader = new NpgsqlBulkUploader(Context);
            await uploader.UpdateAsync(source);
        }

        // public Task BulkUpdateAsync<S, T>(IEnumerable<S> source, Expression<Func<T, S, bool>> joinCondition,
        //     Expression<Func<Tuple<S, T>, T>> setter, bool needAuditor = true) where S : class where T : class
        // {
        //     throw new NotImplementedException();
        // }

        // public virtual async Task BatchUpdateAsync<T>(IEnumerable<T> items, BulkConfig bulkConfig,
        //     bool needAuditor = true) where T : class
        // {
        //     using (var transaction = await Context.Database.BeginTransactionAsync())
        //     {
        //         if (bulkConfig != null)
        //         {
        //             await Context.BulkUpdateAsync<T>(items.ToList(), bulkConfig);
        //         }
        //         else
        //         {
        //             await Context.BulkUpdateAsync<T>(items.ToList());
        //         }
        //
        //         await transaction.CommitAsync();
        //         if (needAuditor)
        //         {
        //             await WriteAuditLogAsync(items.ToList(), AuditActionType.Update);
        //         }
        //     }
        // }

        // public async Task BulkUpdateAsync<S, T>(IEnumerable<S> source, Expression<Func<T, S, bool>> joinCondition,
        //     Expression<Func<Tuple<S, T>, T>> setter, bool needAuditor = true)
        //     where S : class
        //     where T : class
        // {
        //     Stopwatch watch = Stopwatch.StartNew();
        //     BulkCopyOptions opts = new()
        //     {
        //         BulkCopyType = BulkCopyType.ProviderSpecific,
        //         FireTriggers = false,
        //         KeepNulls = true,
        //         KeepIdentity = true,
        //         CheckConstraints = false,
        //     };
        //     List<T> auditData = null;
        //     //Context.Set<>()
        //     
        //     await using (DataConnection ctx = Context.CreateLinq2DbConnectionDetached())
        //     {
        //         string tempName = $"temp_{Guid.NewGuid():n}";
        //         await using (TempTable<S> tempTable = new(ctx, tempName, source, opts,
        //                          tableOptions: TableOptions.IsTemporary))
        //         {
        //             ITable<T> table = ctx.GetTable<T>();
        //             IQueryable<Tuple<S, T>> recordsToUpdate = table.InnerJoin(tempTable, joinCondition,
        //                 (d, s) => new Tuple<S, T>(s, d));
        //             var count = await recordsToUpdate.UpdateAsync(table, setter);
        //             logger.Info(
        //                 $"End to bulk update {typeof(T).Name}, source count: {source.Count()}, update count: {count}, total cost: {watch.Elapsed}");
        //             if (needAuditor && NeedWriteAuditLog<T>())
        //             {
        //                 auditData = await recordsToUpdate.Select((d) => d.Item2).ToListAsync();
        //             }
        //         }
        //     }
        //
        //     if (needAuditor && auditData != null)
        //     {
        //         await WriteAuditLogAsync(auditData, AuditActionType.Update);
        //     }
        //
        //     logger.Info(
        //         $"End to bulk update {typeof(T).Name} audit data, auditData count: {auditData?.Count}, total cost: {watch.Elapsed}");
        // }

        #endregion

        #region Delete

        public async Task<int> DeleteAsync<T>(T entity, bool saveChange = false) where T : class
        {
            //await WriteAuditLogAsync(entity, AuditActionType.Delete);
            Context.Set<T>().Remove(entity);
            int result = await SaveChangesInternalAsync(saveChange, 1);
            return result;
        }

        public async Task<int> DeleteRangeAsync<T>(IEnumerable<T> entities, bool saveChange = false) where T : class
        {
            Context.Set<T>().RemoveRange(entities);
            int result = await SaveChangesInternalAsync(saveChange, entities.Count());
            //await WriteAuditLogAsync(entities.ToList(), AuditActionType.Delete);
            return result;
        }

        public async Task<int> DeleteRangeWithoutAuditAsync<T>(IEnumerable<T> entities, bool saveChange = false)
            where T : class
        {
            Context.Set<T>().RemoveRange(entities);
            int result = await SaveChangesInternalAsync(saveChange, entities.Count());
            return result;
        }


        public async Task<int> DeleteAsync<T>(Expression<Func<T, bool>> predicate) where T : class
        {
            List<T> auditData = null;
            //if (NeedWriteAuditLog<T>())
            //{
            //    auditData = Context.Set<T>().Where(predicate).ToList();
            //}

            //if (auditData != null)
            //{
            //    await WriteAuditLogAsync(auditData, AuditActionType.Delete);
            //}

            return await Context.Set<T>().Where(predicate).ExecuteDeleteAsync();
        }

        #endregion

        #region BySql

        //public IQueryable<T> FromSql<T>(string sql, params object[] param) where T : class
        //{
        //    return Context.Set<T>().FromSqlRaw(sql, param);
        //}

        //public IQueryable<T> FromSql<T>(string formattedSql) where T : class
        //{
        //    return Context.Set<T>().FromSqlRaw(formattedSql);
        //}

        public List<T> SqlQuery<T>(string sql, params object[] param)
        {
            using (var command = Context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = sql;
                command.CommandType = CommandType.Text;
                if (param != null && param.Any())
                {
                    foreach (var p in param)
                    {
                        command.Parameters.Add(p);
                    }
                }

                Context.Database.OpenConnection();
                using (var result = command.ExecuteReader())
                {
                    List<T> list = new List<T>();
                    while (result.Read())
                    {
                        var typeInfo = typeof(T);
                        if (typeInfo.Name == "String")
                        {
                            list.Add((T)result[0]);
                        }
                        else
                        {
                            var obj = Activator.CreateInstance<T>();
                            if (typeof(T).IsClass)
                            {
                                foreach (PropertyInfo prop in obj.GetType().GetProperties())
                                {
                                    if (!Equals(result[prop.Name], DBNull.Value))
                                    {
                                        prop.SetValue(obj, result[prop.Name], null);
                                    }
                                }
                            }
                            else
                            {
                                obj = (T)result[0];
                            }

                            list.Add(obj);
                        }
                    }

                    return list;
                }
            }
        }

        //public int ExecuteSqlCommand(string sql, params object[] param)
        //{
        //    return Context.Database.ExecuteSqlRaw(sql, param);
        //}

        //public int ExecuteSqlCommand(string formattedSql)
        //{
        //    return Context.Database.ExecuteSqlRaw(formattedSql);
        //}

        #endregion

        #region Others

        public async Task<int> SaveChangesAsync(bool trackChange,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            //Context.ChangeTracker.AutoDetectChangesEnabled = trackChange;
            bool saveFailed;
            var result = 0;
            do
            {
                saveFailed = false;
                try
                {
                    result = await Context.SaveChangesAsync(cancellationToken);
                    // logger.Info($"SaveChangesAsync with trackChange: {trackChange}, result: {result}");
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    saveFailed = true;
                    //logger.Warn("An DbUpdateConcurrencyException happened when save change", ex);
                    HandleConcurrency(ex);
                }
            } while (saveFailed);

            return result;
        }

        public virtual async Task<int> SaveChangesAsync(
            CancellationToken cancellationToken = default(CancellationToken))
        {
            bool saveFailed;
            var result = 0;
            do
            {
                saveFailed = false;
                try
                {
                    result = await Context.SaveChangesAsync(cancellationToken);
                    // logger.Info($"SaveChangesAsync result: {result}");
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    saveFailed = true;
                    //logger.Warn("An DbUpdateConcurrencyException happened when save change", ex);
                    HandleConcurrency(ex);
                }
            } while (saveFailed);

            return result;
        }

        private void HandleConcurrency(DbUpdateConcurrencyException ex)
        {
            //logger.Info($"An DbUpdateConcurrencyException happened, entries count: {ex.Entries?.Count}");
            foreach (var entry in ex.Entries)
            {
                // var databaseValues = entry.GetDatabaseValues();
                // if (entry.Entity is CClassRoster)
                // {
                //     logger.Info($"Start to handle DbUpdateConcurrencyException, entry.State: {entry.State}, {entry.Metadata.Name} databaseValues Id: { ((CClassRoster)databaseValues?.ToObject())?.Id }");
                //     // var proposedValues = entry.CurrentValues;
                //     // if (databaseValues != null)
                //     // {
                //     //     entry.OriginalValues.SetValues(databaseValues);
                //     // }
                //     // else
                //     // {
                //         entry.Reload();
                //     // }
                //     logger.Info($"End to handle DbUpdateConcurrencyException, entry.State: {entry.State}, {entry.Metadata.Name} originalValues Id: { ((CClassRoster)entry.OriginalValues?.ToObject())?.Id }");
                // }
                // else
                // {
                //logger.Info(
                //    $"Start to handle DbUpdateConcurrencyException, entry.State: {entry.State}, {entry.Metadata.Name}");
                entry.Reload();
                // throw new NotSupportedException("Don't know how to handle concurrency conflicts for: " + entry.Metadata.Name);
                //logger.Info(
                //    $"End to handle DbUpdateConcurrencyException, entry.State: {entry.State}, {entry.Metadata.Name}");
                // }
            }
        }

        private async Task<int> SaveChangesInternalAsync(bool saveChange, int affectCount)
        {
            if (saveChange)
                return await this.SaveChangesAsync(true);
            else
                return affectCount;
        }

        public void Dispose()
        {
        }

        #endregion
    }
}
